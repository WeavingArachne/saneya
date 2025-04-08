const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("save")
    .setDescription("Save the current playing song to one of your playlists")
    .addStringOption((option) =>
      option
        .setName("playlist")
        .setDescription("The playlist to save the song to")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction, client) {
    const { guild, member, options } = interaction;
    const playlistName = options.getString("playlist");

    // Check if a song is playing
    const player = client.manager.players.get(guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ There is no song currently playing!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

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
      const currentTrack = player.queue.current;

      // Check if track already exists in playlist
      const trackExists = playlist.tracks.some(
        (track) =>
          track.uri === currentTrack.uri ||
          (track.title === currentTrack.title &&
            track.author === currentTrack.author)
      );

      if (trackExists) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `❓ This track is already in your **${playlistName}** playlist!`
              )
              .setColor(client.config.embedColor),
          ],
          ephemeral: true,
        });
      }

      // Create track object to save
      const trackToSave = {
        title: currentTrack.title,
        uri: currentTrack.uri,
        author: currentTrack.author,
        duration: currentTrack.length,
        thumbnail: currentTrack.thumbnail,
        addedAt: Date.now(),
      };

      // Add track to playlist
      playlist.tracks.push(trackToSave);
      playlist.lastUpdated = Date.now();

      // Save playlist
      fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎵 Saved to Playlist")
            .setDescription(
              `Added **[${currentTrack.title}](${currentTrack.uri})** to your **${playlistName}** playlist.`
            )
            .setThumbnail(currentTrack.thumbnail)
            .setColor(client.config.embedColor)
            .setFooter({
              text: `Your playlist now has ${playlist.tracks.length} songs.`,
            }),
        ],
      });
    } catch (error) {
      console.error("Error saving to playlist:", error);
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
