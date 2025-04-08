const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist-list")
    .setDescription(
      "List your saved playlists or view the contents of a specific playlist"
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription(
          "The name of the playlist to view (leave empty to list all playlists)"
        )
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async execute(interaction, client) {
    const userId = interaction.user.id;
    const playlistName = interaction.options.getString("name");

    // Path to user's playlists
    const userPlaylistDir = path.join(
      process.cwd(),
      "data",
      "playlists",
      userId
    );

    // Check if user has any playlists
    if (!fs.existsSync(userPlaylistDir)) {
      fs.mkdirSync(userPlaylistDir, { recursive: true });
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ You don't have any playlists yet!")
            .setColor("Red"),
        ],
      });
    }

    // Get all playlists for the user
    const playlists = fs
      .readdirSync(userPlaylistDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));

    if (playlists.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ You don't have any playlists yet!")
            .setColor("Red"),
        ],
      });
    }

    // If playlist name is provided, show that specific playlist
    if (playlistName) {
      const playlistPath = path.join(userPlaylistDir, `${playlistName}.json`);

      if (!fs.existsSync(playlistPath)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`❌ Playlist \`${playlistName}\` doesn't exist!`)
              .setColor("Red"),
          ],
        });
      }

      // Load the playlist
      let playlist;
      try {
        playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));
      } catch (error) {
        console.error(error);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("❌ Failed to load playlist!")
              .setColor("Red"),
          ],
        });
      }

      // Create embed with playlist info
      const embed = new EmbedBuilder()
        .setTitle(`🎵 Playlist: ${playlistName}`)
        .setColor(client.config.embedColor)
        .setFooter({
          text: `${playlist.tracks.length} tracks • Created: ${new Date(
            playlist.createdAt
          ).toLocaleDateString()}`,
        });

      if (playlist.tracks.length === 0) {
        embed.setDescription("This playlist is empty!");
      } else {
        // Show tracks (limit to 15 for embed)
        const trackList = playlist.tracks
          .slice(0, 15)
          .map(
            (track, i) =>
              `${i + 1}. [${track.title}](${track.url}) - ${formatDuration(
                track.duration
              )}`
          )
          .join(
            "\
"
          );

        embed.setDescription(trackList);

        if (playlist.tracks.length > 15) {
          embed.setDescription(
            trackList +
              `\
... and ${playlist.tracks.length - 15} more tracks`
          );
        }
      }

      return interaction.reply({ embeds: [embed] });
    }

    // Otherwise, show a list of all playlists
    const embed = new EmbedBuilder()
      .setTitle("🎵 Your Playlists")
      .setColor(client.config.embedColor)
      .setDescription(
        playlists
          .map((name, i) => {
            const playlistPath = path.join(userPlaylistDir, `${name}.json`);
            const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));
            return `${i + 1}. **${name}** - ${playlist.tracks.length} tracks`;
          })
          .join(
            "\
"
          )
      )
      .setFooter({
        text: `Use /playlist-list [name] to see the tracks in a specific playlist`,
      });

    interaction.reply({ embeds: [embed] });
  },

  async autocomplete(interaction, client) {
    const userId = interaction.user.id;
    const userPlaylistDir = path.join(
      process.cwd(),
      "data",
      "playlists",
      userId
    );

    // If the user has no playlists directory, return empty
    if (!fs.existsSync(userPlaylistDir)) {
      return interaction.respond([]);
    }

    // Get all playlists for the user
    const playlists = fs
      .readdirSync(userPlaylistDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));

    const focused = interaction.options.getFocused();

    // Filter playlists based on user input
    const filtered = playlists.filter((name) =>
      name.toLowerCase().includes(focused.toLowerCase())
    );

    // Return up to 25 suggestions
    await interaction.respond(
      filtered.slice(0, 25).map((name) => ({ name, value: name }))
    );
  },
};

// Helper function to format duration
function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
