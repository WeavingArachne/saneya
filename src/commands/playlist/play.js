const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist-play")
    .setDescription("Play one of your saved playlists")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the playlist to play")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("shuffle")
        .setDescription("Whether to shuffle the playlist")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const playlistName = interaction.options.getString("name");
    const shouldShuffle = interaction.options.getBoolean("shuffle") || false;
    const userId = interaction.user.id;

    // Defer reply as this might take a moment
    await interaction.deferReply();

    // Voice channel check
    const { channel } = interaction.member.voice;
    if (!channel) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You need to be in a voice channel to play music!"
            )
            .setColor("Red"),
        ],
      });
    }

    // Permission check
    const permissions = channel.permissionsFor(interaction.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ I need permissions to join and speak in your voice channel!"
            )
            .setColor("Red"),
        ],
      });
    }

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

    // Load the playlist
    let playlist;
    try {
      playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));
    } catch (error) {
      console.error(error);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Failed to load playlist!")
            .setColor("Red"),
        ],
      });
    }

    // Check if playlist has tracks
    if (!playlist.tracks.length) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \`${playlistName}\` is empty!`)
            .setColor("Red"),
        ],
      });
    }

    // Create or get player
    const player = client.manager.createPlayer({
      guildId: interaction.guild.id,
      textId: interaction.channel.id,
      voiceId: channel.id,
    });

    // Connect to voice channel if not already connected
    if (!player.connected) await player.connect();

    // Get tracks to play
    let tracksToPlay = [...playlist.tracks];

    // Shuffle if requested
    if (shouldShuffle) {
      for (let i = tracksToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracksToPlay[i], tracksToPlay[j]] = [tracksToPlay[j], tracksToPlay[i]];
      }
    }

    // Add tracks to queue
    const loadedTracks = [];
    const failedTracks = [];

    // Process each track
    for (const track of tracksToPlay) {
      try {
        const result = await client.manager.search(track.url, interaction.user);
        if (result?.tracks?.length) {
          player.queue.add(result.tracks[0]);
          loadedTracks.push(result.tracks[0]);
        } else {
          failedTracks.push(track);
        }
      } catch (e) {
        console.error(`Failed to load track: ${track.title}`, e);
        failedTracks.push(track);
      }
    }

    // Start playing if not already
    if (!player.playing && !player.paused) {
      player.play();
    }

    // Create response message
    const embed = new EmbedBuilder()
      .setTitle(`🎵 Playlist: ${playlistName}`)
      .setColor(client.config.embedColor);

    if (loadedTracks.length) {
      embed.setDescription(
        `✅ Added ${loadedTracks.length} tracks to the queue${
          shouldShuffle ? " (shuffled)" : ""
        }`
      );

      // Show some of the tracks (limit to 5)
      const trackList = loadedTracks
        .slice(0, 5)
        .map(
          (track, i) =>
            `${i + 1}. [${track.title}](${track.uri}) - ${client.formatDuration(
              track.length
            )}`
        )
        .join(
          "\
"
        );

      if (trackList) {
        embed.addFields({
          name: "Tracks",
          value:
            trackList +
            (loadedTracks.length > 5
              ? `\
... and ${loadedTracks.length - 5} more`
              : ""),
        });
      }
    }

    if (failedTracks.length) {
      embed.addFields({
        name: "⚠️ Failed to load",
        value: `${failedTracks.length} track(s) could not be loaded`,
      });
    }

    interaction.editReply({ embeds: [embed] });
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
