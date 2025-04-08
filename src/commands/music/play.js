const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Utils } = require("kazagumo");
const SpotifyUtil = require("../../utils/SpotifyUtil");
const formatTime = require("../../utils/formatTime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(
      "Play a song from YouTube, Spotify, SoundCloud, or other sources."
    )
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song name or URL to play")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction, client) {
    const { guild, member, options } = interaction;
    const query = options.getString("query");

    // Check if user is in a voice channel
    if (!member.voice.channel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You must be in a voice channel to use this command!"
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Check if the bot has permission to join
    const permissions = member.voice.channel.permissionsFor(client.user);
    if (!permissions.has("Connect") || !permissions.has("Speak")) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ I need permissions to join and speak in your voice channel!"
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Defer the reply as track resolution might take some time
    await interaction.deferReply();

    // Create a player
    const existingPlayer = client.manager.players.get(guild.id);
    const player =
      existingPlayer ||
      (await client.manager.createPlayer({
        guildId: guild.id,
        textId: interaction.channelId,
        voiceId: member.voice.channelId,
        deaf: true,
        volume: client.config.defaultVolume || 100,
      }));

    try {
      const result = await client.manager.search(query, {
        requester: member.user,
      });

      if (!result.tracks.length) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`❌ No results found for \"${query}\"!`)
              .setColor(client.config.embedColor),
          ],
        });
      }

      // Check if the result is a playlist
      if (result.type === "PLAYLIST") {
        for (const track of result.tracks) {
          player.queue.add(track);
        }

        // Connect to voice channel if not already
        if (!player.playing && !player.paused) {
          await player.play();
        }

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("📑 Added Playlist to Queue")
              .setDescription(`**[${result.playlistName}](${query})**`)
              .addFields(
                {
                  name: "Enqueued",
                  value: `${result.tracks.length} songs`,
                  inline: true,
                },
                {
                  name: "Duration",
                  value: formatTime(
                    result.tracks.reduce((acc, cur) => acc + cur.length, 0)
                  ),
                  inline: true,
                }
              )
              .setColor(client.config.embedColor),
          ],
        });
      } else {
        // Single track
        const track = result.tracks[0];
        player.queue.add(track);
        // Connect to voice channel if not already
        if (!player.playing && !player.paused) {
          await player.play();
        }

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("🎵 Added to Queue")
              .setDescription(`**[${track.title}](${track.uri})**`)
              .addFields(
                { name: "Artist", value: track.author, inline: true },
                {
                  name: "Duration",
                  value: formatTime(track.length),
                  inline: true,
                },
                {
                  name: "Position in Queue",
                  value:
                    player.queue.length === 0
                      ? "Now Playing"
                      : `#${player.queue.length}`,
                  inline: true,
                }
              )
              .setThumbnail(track.thumbnail)
              .setColor(client.config.embedColor),
          ],
        });
      }
    } catch (error) {
      console.error("Error in play command:", error);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
      });
    }
  },

  async autocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused();

    if (!focusedValue) return;

    try {
      // Check if it's a Spotify URL
      if (SpotifyUtil.isSpotifyUrl(focusedValue)) {
        await interaction.respond([
          {
            name: `🎵 ${focusedValue} (Spotify ${SpotifyUtil.getSpotifyType(
              focusedValue
            )})`,
            value: focusedValue,
          },
        ]);
        return;
      }

      // Search for tracks if not a URL
      if (!focusedValue.startsWith("http")) {
        const results = await client.manager.search(focusedValue, {
          engine: client.config.searchEngine,
        });
        const choices = results.tracks
          .slice(0, client.config.autoCompleteLimit)
          .map((track) => ({
            name:
              `${track.title} - ${track.author}`.length > 100
                ? `${track.title} - ${track.author}`.substring(0, 97) + "..."
                : `${track.title} - ${track.author}`,
            value: track.uri,
          }));

        await interaction.respond(choices);
        return;
      }

      // If it's a URL but not Spotify, just return it
      await interaction.respond([{ name: focusedValue, value: focusedValue }]);
    } catch (error) {
      console.error("Error in play autocomplete:", error);
      await interaction.respond([{ name: focusedValue, value: focusedValue }]);
    }
  },
};
