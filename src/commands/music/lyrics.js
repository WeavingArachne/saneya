const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const lyricsFinder = require("lyrics-finder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Get lyrics for the current or specified song")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription(
          "Song name to search lyrics for (optional, uses current song if not specified)"
        )
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const { guild } = interaction;
    const player = client.manager.players.get(guild.id);
    const query = interaction.options.getString("query");

    // Check if player exists when no query is provided
    if (!query && !player) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ There is no song playing!")
            .setColor(client.config.embedColor),
        ],
      });
    }

    try {
      let songFullTitle, songArtist, songThumbnail;

      // Get song info from query or current playing track
      if (query) {
        // Split the query to get artist and title (assuming format: Artist - Title)
        const parts = query.split("-");
        if (parts.length > 1) {
          songArtist = parts[0].trim();
          songFullTitle = parts.slice(1).join("-").trim();
        } else {
          songFullTitle = query;
          songArtist = "";
        }
        songThumbnail = null;
      } else {
        // Get current playing track info
        const track = player.queue.current;
        if (!track) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ There is no song currently playing!")
                .setColor(client.config.embedColor),
            ],
          });
        }

        songFullTitle = track.title;
        songArtist = track.author;
        songThumbnail = track.thumbnail;
      }

      const regex = /^(.*?)(?=\s*\()/; // Regex pattern to extract song title and artist
      const match = songFullTitle.match(regex);
      if (match) {
        songTitle = match[0];
      } else {
        songTitle = songFullTitle;
      }
      // Search for lyrics
      let lyrics = await lyricsFinder(songArtist, songTitle);
      if (!lyrics) {
        lyrics = "No Lyrics Found 🥹";
      }
      // Split lyrics if they're too long
      const lyricsChunks = [];
      if (lyrics.length > 4000) {
        // Split into chunks of ~4000 characters (keeping lines intact)
        let currentChunk = "";
        lyrics
          .split(
            "\
"
          )
          .forEach((line) => {
            if (currentChunk.length + line.length > 4000) {
              lyricsChunks.push(currentChunk);
              currentChunk = line;
            } else {
              currentChunk +=
                (currentChunk
                  ? "\
"
                  : "") + line;
            }
          });

        if (currentChunk) {
          lyricsChunks.push(currentChunk);
        }
      } else {
        lyricsChunks.push(lyrics);
      }

      // Send first embed
      const firstEmbed = new EmbedBuilder()
        .setTitle(`📃 Lyrics for ${songTitle}`)
        .setDescription(lyricsChunks[0])
        .setColor(client.config.embedColor);

      if (songArtist) {
        firstEmbed.setAuthor({ name: songArtist });
      }

      if (songThumbnail) {
        firstEmbed.setThumbnail(songThumbnail);
      }

      await interaction.editReply({ embeds: [firstEmbed] });

      // Send additional chunks if necessary
      for (let i = 1; i < lyricsChunks.length; i++) {
        const additionalEmbed = new EmbedBuilder()
          .setTitle(`📃 Lyrics for ${songTitle} (continued)`)
          .setDescription(lyricsChunks[i])
          .setColor(client.config.embedColor);

        await interaction.followUp({ embeds: [additionalEmbed] });
      }
    } catch (error) {
      console.error("Error in lyrics command:", error);
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error retrieving lyrics: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
      });
    }
  },

  async autocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused();
    const player = client.manager.players.get(interaction.guildId);

    if (!focusedValue && player?.queue?.current) {
      // If no value provided and current track exists, suggest it
      await interaction.respond([
        {
          name: `${player.queue.current.author} - ${player.queue.current.title}`,
          value: `${player.queue.current.author} - ${player.queue.current.title}`,
        },
      ]);
      return;
    }

    if (!focusedValue) return interaction.respond([]);

    try {
      // Search for tracks
      const results = await client.manager.search(focusedValue, {
        engine: "youtube",
      });

      const choices = results.tracks
        .slice(0, client.config.autoCompleteLimit)
        .map((track) => ({
          name:
            `${track.author} - ${track.title}`.length > 100
              ? `${track.author} - ${track.title}`.substring(0, 97) + "..."
              : `${track.author} - ${track.title}`,
          value: `${track.author} - ${track.title}`,
        }));

      await interaction.respond(choices);
    } catch (error) {
      console.error("Error in lyrics autocomplete:", error);
      await interaction.respond([{ name: focusedValue, value: focusedValue }]);
    }
  },
};
