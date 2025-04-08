const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist-add")
    .setDescription("Add a song to a playlist")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the playlist")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("song")
        .setDescription("The song to add (URL or search term)")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const playlistName = interaction.options.getString("name");
    const query = interaction.options.getString("song");
    const userId = interaction.user.id;

    // Defer reply as this might take a moment
    await interaction.deferReply();

    // Check if the playlist exists
    const playlistDir = path.join(process.cwd(), "data", "playlists", userId);
    const playlistPath = path.join(playlistDir, `${playlistName}.json`);

    if (!fs.existsSync(playlistPath)) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \`${playlistName}\` doesn't exist!`)
            .setColor("Red"),
        ],
      });
    }

    // Search for the song
    let result;
    try {
      result = await client.manager.search(query, interaction.user);
      if (!result || !result.tracks.length) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription("❌ No results found!")
              .setColor("Red"),
          ],
        });
      }
    } catch (e) {
      console.error(e);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Error while searching!")
            .setColor("Red"),
        ],
      });
    }

    // Load the playlist
    let playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

    // Get the first track (or all tracks if it's a playlist)
    const tracksToAdd =
      result.type === "PLAYLIST" ? result.tracks : [result.tracks[0]];

    // Add track(s) to the playlist
    tracksToAdd.forEach((track) => {
      const trackData = {
        title: track.title,
        author: track.author,
        url: track.uri,
        thumbnail: track.thumbnail,
        duration: track.length,
        source: track.sourceName,
      };

      // Check if track already exists to avoid duplicates
      const exists = playlist.tracks.some((t) => t.url === trackData.url);

      if (!exists) {
        playlist.tracks.push(trackData);
      }
    });

    // Save the updated playlist
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

    // Reply with success message
    const trackText =
      tracksToAdd.length === 1
        ? `\"${tracksToAdd[0].title}\" by ${tracksToAdd[0].author}`
        : `${tracksToAdd.length} tracks`;

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `✅ Added ${trackText} to playlist \`${playlistName}\``
          )
          .setColor(client.config.embedColor),
      ],
    });
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
