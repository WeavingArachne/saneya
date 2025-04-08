const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const formatTime = require("../../utils/formatTime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("Display an interactive music dashboard with controls."),

  async execute(interaction, client) {
    const { guild, member } = interaction;

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

    // Get player
    const player = client.manager.players.get(guild.id);
    if (!player) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ There is no music playing in this server!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Check if user is in the same voice channel
    if (member.voice.channelId !== player.voiceId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `❌ You must be in the same voice channel as me to use this command!`
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Create dashboard embed
    await this.updateDashboard(interaction, player, client);
  },

  async updateDashboard(interaction, player, client, existingMessage = null) {
    const track = player.queue.current;

    if (!track) {
      const emptyEmbed = new EmbedBuilder()
        .setTitle("🎵 Music Dashboard")
        .setDescription("No song is currently playing.")
        .setColor(client.config.embedColor);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("dashboard_refresh")
          .setLabel("Refresh")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄")
      );

      if (existingMessage) {
        await existingMessage.edit({ embeds: [emptyEmbed], components: [row] });
      } else {
        await interaction.reply({ embeds: [emptyEmbed], components: [row] });
      }
      return;
    }

    // Format progress bar
    const progress = player.position;
    const total = track.length || 0;
    const progressBar = this.createProgressBar(progress, total);

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("🎵 Music Dashboard")
      .setDescription(`**Now Playing:** [${track.title}](${track.uri})`)
      .addFields(
        { name: "Artist", value: track.author, inline: true },
        {
          name: "Requested By",
          value: `<@${track.requester.id}>`,
          inline: true,
        },
        {
          name: "Duration",
          value: `${formatTime(progress)} / ${formatTime(total)}`,
          inline: true,
        },
        { name: "Progress", value: progressBar, inline: false }
      )
      .setThumbnail(track.thumbnail)
      .setColor(client.config.embedColor)
      .setFooter({
        text: `Volume: ${player.volume}% | Queue: ${player.queue.length} songs`,
      });

    // Add loop status
    if (player.loop === "track") {
      embed.addFields({ name: "Loop Mode", value: "🔂 Track", inline: true });
    } else if (player.loop === "queue") {
      embed.addFields({ name: "Loop Mode", value: "🔁 Queue", inline: true });
    }

    // Add filter status
    const activeFilters = Object.entries(player.filters)
      .filter(([_, value]) => value === true)
      .map(([filter]) => filter);

    if (activeFilters.length > 0) {
      embed.addFields({
        name: "Active Filters",
        value: activeFilters.join(", "),
        inline: true,
      });
    }

    // Create buttons
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("dashboard_previous")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏮️"),
      new ButtonBuilder()
        .setCustomId(player.paused ? "dashboard_resume" : "dashboard_pause")
        .setLabel(player.paused ? "Resume" : "Pause")
        .setStyle(player.paused ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji(player.paused ? "▶️" : "⏸️"),
      new ButtonBuilder()
        .setCustomId("dashboard_skip")
        .setLabel("Skip")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏭️"),
      new ButtonBuilder()
        .setCustomId("dashboard_stop")
        .setLabel("Stop")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⏹️")
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("dashboard_loop")
        .setLabel("Loop")
        .setStyle(
          player.loop !== "none" ? ButtonStyle.Success : ButtonStyle.Secondary
        )
        .setEmoji(player.loop === "track" ? "🔂" : "🔁"),
      new ButtonBuilder()
        .setCustomId("dashboard_shuffle")
        .setLabel("Shuffle")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔀"),
      new ButtonBuilder()
        .setCustomId("dashboard_volume_down")
        .setLabel("Vol -")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔉"),
      new ButtonBuilder()
        .setCustomId("dashboard_volume_up")
        .setLabel("Vol +")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔊")
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("dashboard_queue")
        .setLabel("Queue")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📑"),
      new ButtonBuilder()
        .setCustomId("dashboard_filters")
        .setLabel("Filters")
        .setStyle(
          activeFilters.length > 0 ? ButtonStyle.Success : ButtonStyle.Secondary
        )
        .setEmoji("🎛️"),
      new ButtonBuilder()
        .setCustomId("dashboard_lyrics")
        .setLabel("Lyrics")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📃"),
      new ButtonBuilder()
        .setCustomId("dashboard_refresh")
        .setLabel("Refresh")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔄")
    );

    const messageOptions = {
      embeds: [embed],
      components: [row1, row2, row3],
    };

    try {
      if (existingMessage) {
        await existingMessage.edit(messageOptions);
      } else {
        await interaction.reply(messageOptions);
      }
    } catch (error) {
      console.error("Error updating dashboard:", error);
      try {
        // If editing failed, try sending a new message
        if (existingMessage) {
          await interaction.followUp({
            content:
              "Dashboard refreshed due to an error with the previous one.",
            ...messageOptions,
          });
        }
      } catch (err) {
        console.error("Failed to recover from dashboard error:", err);
      }
    }
  },

  createProgressBar(current, total, length = 15) {
    if (!current || !total || total === 0) {
      return "░".repeat(length) + " [0:00/0:00]";
    }

    const progress = Math.floor((current / total) * length);
    const emptyProgress = length - progress;

    const progressBar = "▓".repeat(progress);
    const emptyProgressBar = "░".repeat(emptyProgress);

    return `${progressBar}${emptyProgressBar} [${formatTime(
      current
    )}/${formatTime(total)}]`;
  },

  async buttonAction(interaction, client) {
    try {
      const { customId, member, message } = interaction;
      const player = client.manager.players.get(interaction.guildId);

      // Check if player exists
      if (!player) {
        return interaction.reply({
          content: "❌ There is no music playing in this server!",
          ephemeral: true,
        });
      }

      // Check if user is in the same voice channel
      if (!member.voice.channel || member.voice.channelId !== player.voiceId) {
        return interaction.reply({
          content:
            "❌ You must be in the same voice channel as me to use this!",
          ephemeral: true,
        });
      }

      switch (customId) {
        case "dashboard_previous":
          // Play previous track if there is one
          if (player.queue.previous && player.queue.previous.length > 0) {
            player.queue.unshift(
              player.queue.previous[player.queue.previous.length - 1]
            );
            player.skip();
            await interaction.deferUpdate();
          } else {
            await interaction.reply({
              content: "❌ There is no previous track!",
              ephemeral: true,
            });
          }
          break;
        case "dashboard_pause":
          player.pause(true);
          await this.updateDashboard(interaction, player, client, message);
          await interaction.deferUpdate();
          break;
        case "dashboard_resume":
          player.pause(false);
          await this.updateDashboard(interaction, player, client, message);
          await interaction.deferUpdate();
          break;
        case "dashboard_skip":
          player.skip();
          await interaction.reply({
            content: "⏭️ Skipped to the next track!",
            ephemeral: true,
          });
          setTimeout(() => {
            this.updateDashboard(interaction, player, client, message);
          }, 1000); // Small delay to let the player update
          break;
        case "dashboard_stop":
          player.destroy();
          await interaction.reply({
            content: "⏹️ Stopped the music and cleared the queue!",
            ephemeral: true,
          });
          break;
        case "dashboard_loop":
          // Toggle loop modes: none -> track -> queue -> none
          if (player.loop === "none") {
            player.setLoop("track");
          } else if (player.loop === "track") {
            player.setLoop("queue");
          } else {
            player.setLoop("none");
          }
          await this.updateDashboard(interaction, player, client, message);
          await interaction.deferUpdate();
          break;
        case "dashboard_shuffle":
          player.queue.shuffle();
          await interaction.reply({
            content: "🔀 Shuffled the queue!",
            ephemeral: true,
          });
          break;
        case "dashboard_volume_down":
          const currentVol = player.volume;
          const newVol = Math.max(0, currentVol - 10);
          player.setVolume(newVol);
          await this.updateDashboard(interaction, player, client, message);
          await interaction.deferUpdate();
          break;
        case "dashboard_volume_up":
          const currVol = player.volume;
          const newVolume = Math.min(100, currVol + 10);
          player.setVolume(newVolume);
          await this.updateDashboard(interaction, player, client, message);
          await interaction.deferUpdate();
          break;
        case "dashboard_queue":
          // Display queue
          const queue = player.queue;
          if (!queue.length && !player.queue.current) {
            await interaction.reply({
              content: "❌ The queue is empty!",
              ephemeral: true,
            });
            return;
          }

          const queueEmbed = new EmbedBuilder()
            .setTitle("📑 Music Queue")
            .setColor(client.config.embedColor);

          // Add current track
          if (player.queue.current) {
            queueEmbed.addFields({
              name: "🎵 Now Playing",
              value: `[${player.queue.current.title}](${player.queue.current.uri}) - Requested by <@${player.queue.current.requester.id}>`,
              inline: false,
            });
          }

          // Add queue
          if (queue.length) {
            const songs = queue
              .map((track, i) => {
                return `**${i + 1}.** [${track.title}](${
                  track.uri
                }) - Requested by <@${track.requester.id}>`;
              })
              .slice(0, 10);

            queueEmbed.addFields({
              name: `📋 Queue (${queue.length} tracks)`,
              value:
                songs.join("\n") +
                (queue.length > 10 ? `\n...and ${queue.length - 10} more` : ""),
              inline: false,
            });
          }

          await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
          break;
        case "dashboard_filters":
          // Display filters menu
          const filterEmbed = new EmbedBuilder()
            .setTitle("🎛️ Audio Filters")
            .setDescription("Select a filter to apply to the current music.")
            .setColor(client.config.embedColor);

          const activeFilters = Object.entries(player.filters)
            .filter(([_, value]) => value === true)
            .map(([filter]) => filter);

          if (activeFilters.length > 0) {
            filterEmbed.addFields({
              name: "Active Filters",
              value: activeFilters.join(", "),
              inline: false,
            });
          }

          // Show most common filters as buttons
          const filtersRow1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("filter_bassboost")
              .setLabel("Bass Boost")
              .setStyle(
                player.filters.bassboost
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary
              ),
            new ButtonBuilder()
              .setCustomId("filter_8D")
              .setLabel("8D")
              .setStyle(
                player.filters["8D"]
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary
              ),
            new ButtonBuilder()
              .setCustomId("filter_nightcore")
              .setLabel("Nightcore")
              .setStyle(
                player.filters.nightcore
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary
              ),
            new ButtonBuilder()
              .setCustomId("filter_vaporwave")
              .setLabel("Vaporwave")
              .setStyle(
                player.filters.vaporwave
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary
              )
          );

          const filtersRow2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("filter_karaoke")
              .setLabel("Karaoke")
              .setStyle(
                player.filters.karaoke
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary
              ),
            new ButtonBuilder()
              .setCustomId("filter_tremolo")
              .setLabel("Tremolo")
              .setStyle(
                player.filters.tremolo
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary
              ),
            new ButtonBuilder()
              .setCustomId("filter_vibrato")
              .setLabel("Vibrato")
              .setStyle(
                player.filters.vibrato
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary
              ),
            new ButtonBuilder()
              .setCustomId("filter_reset")
              .setLabel("Reset All")
              .setStyle(ButtonStyle.Danger)
          );

          await interaction.reply({
            embeds: [filterEmbed],
            components: [filtersRow1, filtersRow2],
            ephemeral: true,
          });
          break;
        case "dashboard_lyrics":
          // Get lyrics for current song
          const currentTrack = player.queue.current;
          if (!currentTrack) {
            await interaction.reply({
              content: "❌ There is no song currently playing!",
              ephemeral: true,
            });
            return;
          }

          // Use the lyrics command functionality directly
          const lyricsCommand = client.commands.get("lyrics");
          if (lyricsCommand) {
            // Create a "fake" interaction for the lyrics command
            const fakeInteraction = {
              ...interaction,
              options: {
                getString: () =>
                  `${currentTrack.author} - ${currentTrack.title}`,
              },
            };

            await lyricsCommand.execute(fakeInteraction, client);
          } else {
            await interaction.reply({
              content: "❌ Lyrics command not found!",
              ephemeral: true,
            });
          }
          break;
        case "dashboard_refresh":
          await interaction.deferUpdate();
          await this.updateDashboard(interaction, player, client, message);
          break;
        default:
          // Handle filter buttons
          if (customId.startsWith("filter_")) {
            const filterName = customId.replace("filter_", "");

            if (filterName === "reset") {
              // Reset all filters
              await player.shoukaku.clearFilters();
              await interaction.reply({
                content: "🔄 All filters have been reset!",
                ephemeral: true,
              });
              setTimeout(() => {
                this.updateDashboard(interaction, player, client, message);
              }, 500);
            } else if (
              client.config.filters &&
              client.config.filters[filterName]
            ) {
              // Toggle filter
              try {
                await player.shoukaku.setFilters({
                  [filterName]: !player.filters[filterName],
                });
                await interaction.reply({
                  content: player.filters?.[filterName]
                    ? `📈 Filter \`${filterName}\` has been enabled!`
                    : `📉 Filter \`${filterName}\` has been disabled!`,
                  ephemeral: true,
                });
                setTimeout(() => {
                  this.updateDashboard(interaction, player, client, message);
                }, 500);
              } catch (filterError) {
                console.error(`Filter error (${filterName}):`, filterError);
                await interaction.reply({
                  content: `❌ Error applying filter: ${filterError.message}`,
                  ephemeral: true,
                });
              }
            } else {
              await interaction.reply({
                content: "❌ Invalid filter!",
                ephemeral: true,
              });
            }
          } else {
            await interaction.reply({
              content: "❌ Unknown button interaction!",
              ephemeral: true,
            });
          }
          break;
      }
    } catch (error) {
      console.error("Error in dashboard button action:", error);
      try {
        await interaction
          .reply({
            content: `❌ Error: ${error.message}`,
            ephemeral: true,
          })
          .catch((e) => {
            // If reply fails, try followUp
            interaction
              .followUp({
                content: `❌ Error: ${error.message}`,
                ephemeral: true,
              })
              .catch(console.error);
          });
      } catch (err) {
        console.error("Failed to respond to error:", err);
      }
    }
  },
};
