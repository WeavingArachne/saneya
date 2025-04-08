const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
// const prettyMs = require("pretty-ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("details")
    .setDescription("View detailed information about a playlist")
    .addStringOption((option) =>
      option
        .setName("playlist")
        .setDescription("The playlist to view")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction, client) {
    const prettyMs = (await import("pretty-ms")).default; // ✅ dynamic import here
    const { member, options } = interaction;
    const playlistName = options.getString("playlist");

    // Create data directory if it doesn't exist
    const dataDir = path.resolve(__dirname, "../../../data");
    const playlistsDir = path.join(dataDir, "playlists");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (!fs.existsSync(playlistsDir)) fs.mkdirSync(playlistsDir);

    // User's playlists directory
    const userPlaylistsDir = path.join(playlistsDir, member.user.id);
    if (!fs.existsSync(userPlaylistsDir)) fs.mkdirSync(userPlaylistsDir);

    // Check if playlist exists
    const playlistPath = path.join(userPlaylistsDir, `${playlistName}.json`);
    if (!fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `❌ Playlist **${playlistName}** not found! Create it first with \`/playlist create\`.`
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    try {
      // Read playlist file
      const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

      // Calculate total duration
      const totalDuration = playlist.tracks.reduce(
        (acc, track) => acc + track.duration,
        0
      );

      // Format creation and update dates
      const createdAt = new Date(playlist.createdAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );

      const updatedAt = new Date(playlist.lastUpdated).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );

      // Create playlist details embed
      const embed = new EmbedBuilder()
        .setTitle(`📃 Playlist: ${playlistName}`)
        .setDescription(playlist.description || "No description")
        .addFields(
          { name: "Tracks", value: `${playlist.tracks.length}`, inline: true },
          {
            name: "Total Duration",
            value: prettyMs(totalDuration, { verbose: true }),
            inline: true,
          },
          { name: "Created", value: createdAt, inline: true },
          { name: "Last Updated", value: updatedAt, inline: true }
        )
        .setColor(client.config.embedColor)
        .setFooter({ text: `Owner: ${member.user.tag}` });

      // Add track list (first 10 tracks)
      if (playlist.tracks.length > 0) {
        const trackList = playlist.tracks
          .slice(0, 10)
          .map(
            (track, index) =>
              `${index + 1}. [${track.title}](${track.uri}) - ${prettyMs(
                track.duration,
                { compact: true }
              )}`
          )
          .join(
            "\\\
"
          );

        embed.addFields({
          name: "Tracks (first 10)",
          value: trackList || "No tracks",
        });

        if (playlist.tracks.length > 10) {
          embed.setFooter({
            text: `Owner: ${member.user.tag} • Showing 10/${playlist.tracks.length} tracks`,
          });
        }
      }

      // Create control buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`play_playlist:${playlistName}`)
          .setLabel("Play All")
          .setEmoji("▶️")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`shuffle_playlist:${playlistName}`)
          .setLabel("Shuffle")
          .setEmoji("🔀")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`delete_playlist:${playlistName}`)
          .setLabel("Delete")
          .setEmoji("🗑️")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("Error viewing playlist details:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }
  },

  async autocomplete(interaction, client) {
    const { member } = interaction;
    const focusedValue = interaction.options.getFocused().toLowerCase();

    // Get user's playlists
    const playlistsDir = path.resolve(
      __dirname,
      "../../../data/playlists",
      member.user.id
    );

    if (!fs.existsSync(playlistsDir)) {
      await interaction.respond([
        { name: "No playlists found. Create one first!", value: "create_new" },
      ]);
      return;
    }

    // Get all JSON files in the user's playlists directory
    const files = fs
      .readdirSync(playlistsDir)
      .filter((file) => file.endsWith(".json"));

    if (files.length === 0) {
      await interaction.respond([
        { name: "No playlists found. Create one first!", value: "create_new" },
      ]);
      return;
    }

    // Filter playlists by focused value and map to choices
    const choices = files
      .map((file) => file.replace(".json", ""))
      .filter((name) => name.toLowerCase().includes(focusedValue))
      .map((name) => ({
        name,
        value: name,
      }));

    await interaction.respond(choices.slice(0, 25));
  },
};
