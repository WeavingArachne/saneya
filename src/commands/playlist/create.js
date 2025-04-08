const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Create and manage your music playlists")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new playlist")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of the playlist")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a song to your playlist")
        .addStringOption((option) =>
          option
            .setName("playlist")
            .setDescription("Name of the playlist")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("Song name or URL to add")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("play")
        .setDescription("Play a saved playlist")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of the playlist")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List your saved playlists")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("View songs in a playlist")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of the playlist")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a song from your playlist")
        .addStringOption((option) =>
          option
            .setName("playlist")
            .setDescription("Name of the playlist")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("position")
            .setDescription("Position of the song in the playlist")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a playlist")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of the playlist")
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      await this.createPlaylist(interaction, client);
    } else if (subcommand === "add") {
      await this.addToPlaylist(interaction, client);
    } else if (subcommand === "play") {
      await this.playPlaylist(interaction, client);
    } else if (subcommand === "list") {
      await this.listPlaylists(interaction, client);
    } else if (subcommand === "view") {
      await this.viewPlaylist(interaction, client);
    } else if (subcommand === "remove") {
      await this.removeSongFromPlaylist(interaction, client);
    } else if (subcommand === "delete") {
      await this.deletePlaylist(interaction, client);
    }
  },

  async createPlaylist(interaction, client) {
    const { guild, user } = interaction;
    const playlistName = interaction.options.getString("name");

    // Ensure playlist name is valid
    if (playlistName.length > 32) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Playlist name cannot exceed 32 characters.")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Create directory if it doesn't exist
    const userDir = path.resolve(
      __dirname,
      `../../../data/playlists/${user.id}`
    );
    if (!fs.existsSync(path.resolve(__dirname, "../../../data"))) {
      fs.mkdirSync(path.resolve(__dirname, "../../../data"));
    }
    if (!fs.existsSync(path.resolve(__dirname, "../../../data/playlists"))) {
      fs.mkdirSync(path.resolve(__dirname, "../../../data/playlists"));
    }
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const playlistPath = path.join(userDir, `${playlistName}.json`);

    // Check if playlist already exists
    if (fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `❌ You already have a playlist named \"${playlistName}\".`
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Create new playlist
    const playlist = {
      name: playlistName,
      createdAt: new Date().toISOString(),
      tracks: [],
    };

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📝 Playlist Created")
          .setDescription(`Successfully created playlist **${playlistName}**!`)
          .addFields(
            { name: "Created By", value: `<@${user.id}>`, inline: true },
            { name: "Songs", value: "0", inline: true }
          )
          .setColor(client.config.embedColor)
          .setFooter({
            text: `Use /playlist add ${playlistName} [song] to add songs`,
          }),
      ],
    });
  },

  async addToPlaylist(interaction, client) {
    const { guild, user } = interaction;
    const playlistName = interaction.options.getString("playlist");
    const query = interaction.options.getString("query");

    // Check if playlist exists
    const userDir = path.resolve(
      __dirname,
      `../../../data/playlists/${user.id}`
    );
    const playlistPath = path.join(userDir, `${playlistName}.json`);

    if (!fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \"${playlistName}\" not found.`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Search for the song
    await interaction.deferReply();

    try {
      const result = await client.manager.search(query, { requester: user });

      if (!result.tracks.length) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`❌ No results found for \"${query}\"!`)
              .setColor(client.config.embedColor),
          ],
        });
      }

      // Load playlist data
      const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

      if (result.type === "PLAYLIST") {
        // Add all tracks from the playlist
        for (const track of result.tracks) {
          playlist.tracks.push({
            title: track.title,
            author: track.author,
            uri: track.uri,
            thumbnail: track.thumbnail,
            length: track.length,
            source: track.sourceName,
          });
        }

        // Save updated playlist
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("📑 Added to Playlist")
              .setDescription(
                `Added **${result.tracks.length} songs** from **[${result.playlistName}](${query})** to your playlist **${playlistName}**`
              )
              .setColor(client.config.embedColor)
              .setFooter({
                text: `Playlist now has ${playlist.tracks.length} songs`,
              }),
          ],
        });
      } else {
        // Add single track
        const track = result.tracks[0];

        playlist.tracks.push({
          title: track.title,
          author: track.author,
          uri: track.uri,
          thumbnail: track.thumbnail,
          length: track.length,
          source: track.sourceName,
        });

        // Save updated playlist
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("🎵 Added to Playlist")
              .setDescription(
                `Added **[${track.title}](${track.uri})** to your playlist **${playlistName}**`
              )
              .setThumbnail(track.thumbnail)
              .addFields(
                { name: "Artist", value: track.author, inline: true },
                {
                  name: "Duration",
                  value: client.formatDuration(track.length),
                  inline: true,
                },
                {
                  name: "Position",
                  value: `#${playlist.tracks.length}`,
                  inline: true,
                }
              )
              .setColor(client.config.embedColor)
              .setFooter({
                text: `Playlist now has ${playlist.tracks.length} songs`,
              }),
          ],
        });
      }
    } catch (error) {
      console.error("Error in playlist add command:", error);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
      });
    }
  },

  async playPlaylist(interaction, client) {
    const { guild, member } = interaction;
    const playlistName = interaction.options.getString("name");

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

    // Check if playlist exists
    const userDir = path.resolve(
      __dirname,
      `../../../data/playlists/${interaction.user.id}`
    );
    const playlistPath = path.join(userDir, `${playlistName}.json`);

    if (!fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \"${playlistName}\" not found.`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Load playlist
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

    if (playlist.tracks.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \"${playlistName}\" is empty.`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // Create player
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
      // Add all tracks to queue
      for (const trackInfo of playlist.tracks) {
        const result = await player.search(trackInfo.uri, {
          requester: interaction.user,
        });
        if (result.tracks.length) {
          await player.queue.add(result.tracks[0]);
        }
      }

      if (!player.playing && !player.paused) {
        await player.play();
      }

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("📑 Playing Playlist")
            .setDescription(`Started playing playlist **${playlistName}**`)
            .addFields(
              {
                name: "Songs",
                value: `${playlist.tracks.length}`,
                inline: true,
              },
              {
                name: "First Track",
                value: `[${playlist.tracks[0].title}](${playlist.tracks[0].uri})`,
                inline: true,
              }
            )
            .setColor(client.config.embedColor),
        ],
      });
    } catch (error) {
      console.error("Error in playlist play command:", error);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
      });
    }
  },

  async listPlaylists(interaction, client) {
    const { user } = interaction;

    // Check if user has any playlists
    const userDir = path.resolve(
      __dirname,
      `../../../data/playlists/${user.id}`
    );

    if (!fs.existsSync(userDir)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You don't have any playlists yet. Create one with `/playlist create`."
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    const playlists = fs
      .readdirSync(userDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const data = JSON.parse(
          fs.readFileSync(path.join(userDir, file), "utf8")
        );
        return {
          name: data.name,
          trackCount: data.tracks.length,
          createdAt: new Date(data.createdAt).toLocaleDateString(),
        };
      });

    if (playlists.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You don't have any playlists yet. Create one with `/playlist create`."
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Create playlist list embed
    const embed = new EmbedBuilder()
      .setTitle("📑 Your Playlists")
      .setDescription(
        playlists
          .map(
            (p, i) =>
              `**${i + 1}.** ${p.name} (${p.trackCount} tracks) - Created: ${
                p.createdAt
              }`
          )
          .join(
            "\
"
          )
      )
      .setColor(client.config.embedColor)
      .setFooter({ text: `Total playlists: ${playlists.length}` });

    return interaction.reply({ embeds: [embed] });
  },

  async viewPlaylist(interaction, client) {
    const { user } = interaction;
    const playlistName = interaction.options.getString("name");

    // Check if playlist exists
    const userDir = path.resolve(
      __dirname,
      `../../../data/playlists/${user.id}`
    );
    const playlistPath = path.join(userDir, `${playlistName}.json`);

    if (!fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \"${playlistName}\" not found.`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Load playlist
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

    if (playlist.tracks.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `Playlist "${playlistName}" is empty. Add songs with \`/playlist add\`.`
            )
            .setColor(client.config.embedColor),
        ],
      });
    }

    // Format track list
    const tracks = playlist.tracks.map(
      (track, i) =>
        `**${i + 1}.** [${track.title}](${track.uri}) - ${
          track.author
        } (${client.formatDuration(track.length)})`
    );

    // Split into multiple embeds if needed (Discord has a 6000 character limit)
    const embeds = [];
    let currentEmbed = new EmbedBuilder()
      .setTitle(`📑 Playlist: ${playlistName}`)
      .setColor(client.config.embedColor)
      .setFooter({ text: `Total tracks: ${playlist.tracks.length}` });

    let currentDescription = "";

    for (const track of tracks) {
      if (currentDescription.length + track.length + 1 > 4096) {
        // Current embed is full, finalize it and create a new one
        currentEmbed.setDescription(currentDescription);
        embeds.push(currentEmbed);

        currentEmbed = new EmbedBuilder()
          .setTitle(`📑 Playlist: ${playlistName} (Continued)`)
          .setColor(client.config.embedColor)
          .setFooter({ text: `Total tracks: ${playlist.tracks.length}` });

        currentDescription =
          track +
          "\
";
      } else {
        currentDescription +=
          track +
          "\
";
      }
    }

    // Add the last embed
    currentEmbed.setDescription(currentDescription);
    embeds.push(currentEmbed);

    // Send all embeds
    await interaction.reply({ embeds: [embeds[0]] });

    // Send additional embeds as follow-ups
    for (let i = 1; i < embeds.length; i++) {
      await interaction.followUp({ embeds: [embeds[i]] });
    }
  },

  async removeSongFromPlaylist(interaction, client) {
    const { user } = interaction;
    const playlistName = interaction.options.getString("playlist");
    const position = interaction.options.getInteger("position");

    // Check if playlist exists
    const userDir = path.resolve(
      __dirname,
      `../../../data/playlists/${user.id}`
    );
    const playlistPath = path.join(userDir, `${playlistName}.json`);

    if (!fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \"${playlistName}\" not found.`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Load playlist
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

    // Check if position is valid
    if (position < 1 || position > playlist.tracks.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `❌ Invalid position. The playlist has ${playlist.tracks.length} tracks.`
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Remove track
    const removedTrack = playlist.tracks.splice(position - 1, 1)[0];

    // Save updated playlist
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗑️ Removed from Playlist")
          .setDescription(
            `Removed **[${removedTrack.title}](${removedTrack.uri})** from your playlist **${playlistName}**`
          )
          .setColor(client.config.embedColor)
          .setFooter({
            text: `Playlist now has ${playlist.tracks.length} songs`,
          }),
      ],
    });
  },

  async deletePlaylist(interaction, client) {
    const { user } = interaction;
    const playlistName = interaction.options.getString("name");

    // Check if playlist exists
    const userDir = path.resolve(
      __dirname,
      `../../../data/playlists/${user.id}`
    );
    const playlistPath = path.join(userDir, `${playlistName}.json`);

    if (!fs.existsSync(playlistPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Playlist \"${playlistName}\" not found.`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Delete playlist
    fs.unlinkSync(playlistPath);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `✅ Successfully deleted playlist **${playlistName}**.`
          )
          .setColor(client.config.embedColor),
      ],
    });
  },

  async autocomplete(interaction, client) {
    const { user } = interaction;
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "query") {
      // This is the same logic as in play.js for song autocomplete
      const focusedValue = focusedOption.value;

      if (!focusedValue) return interaction.respond([]);

      try {
        // Check if it's a Spotify URL
        const SpotifyUtil = require("../../util/SpotifyUtil");
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
        await interaction.respond([
          { name: focusedValue, value: focusedValue },
        ]);
      } catch (error) {
        console.error("Error in playlist add autocomplete:", error);
        await interaction.respond([
          { name: focusedValue, value: focusedValue },
        ]);
      }
    } else if (
      focusedOption.name === "playlist" ||
      focusedOption.name === "name"
    ) {
      // List user's playlists for autocomplete
      const userDir = path.resolve(
        __dirname,
        `../../../data/playlists/${user.id}`
      );

      if (!fs.existsSync(userDir)) {
        return interaction.respond([]);
      }

      const playlists = fs
        .readdirSync(userDir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => {
          const name = file.replace(".json", "");
          return { name, value: name };
        })
        .filter((playlist) => {
          if (!focusedOption.value) return true;
          return playlist.name
            .toLowerCase()
            .includes(focusedOption.value.toLowerCase());
        })
        .slice(0, 25);

      await interaction.respond(playlists);
    } else if (focusedOption.name === "position") {
      // Get track positions for the specified playlist
      const playlistName = interaction.options.getString("playlist");

      if (!playlistName) {
        return interaction.respond([]);
      }

      const userDir = path.resolve(
        __dirname,
        `../../../data/playlists/${user.id}`
      );
      const playlistPath = path.join(userDir, `${playlistName}.json`);

      if (!fs.existsSync(playlistPath)) {
        return interaction.respond([]);
      }

      const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf8"));

      const positions = playlist.tracks.map((track, index) => ({
        name:
          `#${index + 1}: ${track.title}`.length > 100
            ? `#${index + 1}: ${track.title}`.substring(0, 97) + "..."
            : `#${index + 1}: ${track.title}`,
        value: index + 1,
      }));

      await interaction.respond(positions);
    }
  },
};
