const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist-remove")
    .setDescription(
      "Remove a track from a playlist or delete an entire playlist"
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the playlist")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("track")
        .setDescription(
          "The track number to remove (leave empty to delete the entire playlist)"
        )
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    const playlistName = interaction.options.getString("name");
    const trackIndex = interaction.options.getInteger("track");
    const userId = interaction.user.id;

    // Path to the playlist
    const playlistDir = path.join(process.cwd(), "data", "playlists", userId);
    const playlistPath = path.join(playlistDir, `${playlistName}.json`);

    // Check if the playlist exists
    if (!fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \`${playlistName}\` doesn't exist!`)
            .setColor("Red"),
        ],
      });
    }

    // If no track index is provided, delete the entire playlist
    if (!trackIndex) {
      try {
        fs.unlinkSync(playlistPath);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`✅ Deleted playlist \`${playlistName}\``)
              .setColor(client.config.embedColor),
          ],
        });
      } catch (error) {
        console.error(error);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("❌ Failed to delete playlist!")
              .setColor("Red"),
          ],
        });
      }
    }

    // Otherwise, remove a specific track
    try {
      // Load the playlist
      let playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

      // Check if the track index is valid
      if (trackIndex > playlist.tracks.length) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `❌ Invalid track number! Playlist has ${playlist.tracks.length} tracks.`
              )
              .setColor("Red"),
          ],
        });
      }

      // Remove the track (trackIndex is 1-based, but array is 0-based)
      const removedTrack = playlist.tracks.splice(trackIndex - 1, 1)[0];

      // Save the updated playlist
      fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

      // Reply with success message
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `✅ Removed track "${removedTrack.title}" from playlist \`${playlistName}\``
            )
            .setColor(client.config.embedColor),
        ],
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Failed to remove track from playlist!")
            .setColor("Red"),
        ],
      });
    }
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
