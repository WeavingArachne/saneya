const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const formatTime = require("../../utils/formatTime");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for tracks and choose one to play.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song name to search for")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("source")
        .setDescription("Platform to search on")
        .setRequired(false)
        .addChoices(
          { name: "YouTube", value: "youtube" },
          { name: "SoundCloud", value: "soundcloud" },
          { name: "Spotify", value: "spotify" }
        )
    ),

  async execute(interaction, client) {
    const { guild, member, options } = interaction;
    const query = options.getString("query");
    const source = options.getString("source") || client.config.searchEngine;

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

    try {
      // Search for tracks
      const result = await client.manager.search(query, {
        requester: member.user,
        engine: source,
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

      // Extract top tracks (max 10)
      const tracks = result.tracks.slice(0, 10);

      // Create selection embed
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Search Results for \"${query}\"`)
        .setDescription(
          tracks
            .map(
              (track, index) =>
                `**${index + 1}.** [${track.title}](${track.uri}) - ${
                  track.author
                } (${formatTime(track.length)})`
            )
            .join("\n")
        )
        .setColor(client.config.embedColor)
        .setFooter({ text: "Select a track within 30 seconds" });

      // Create selection buttons (5 per row, max 2 rows)
      const rows = [];

      // Row 1 (buttons 1-5)
      const row1 = new ActionRowBuilder();
      for (let i = 0; i < Math.min(5, tracks.length); i++) {
        row1.addComponents(
          new ButtonBuilder()
            .setCustomId(`search:${i}`)
            .setLabel(`${i + 1}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
      rows.push(row1);

      // Row 2 (buttons 6-10) if needed
      if (tracks.length > 5) {
        const row2 = new ActionRowBuilder();
        for (let i = 5; i < tracks.length; i++) {
          row2.addComponents(
            new ButtonBuilder()
              .setCustomId(`search:${i}`)
              .setLabel(`${i + 1}`)
              .setStyle(ButtonStyle.Primary)
          );
        }
        rows.push(row2);
      }

      // Add cancel button
      const cancelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("search:cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary)
      );
      rows.push(cancelRow);

      // Send message with buttons
      const message = await interaction.editReply({
        embeds: [embed],
        components: rows,
      });

      // Create a player if it doesn't exist already - Fixed to properly await the Promise
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

      // Create collector
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
      });

      // Handle selections
      collector.on("collect", async (i) => {
        // Check if interaction is from the command user
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: "❌ This button is not for you!",
            ephemeral: true,
          });
        }

        // Get selected index from button ID
        const [, selection] = i.customId.split(":");

        // Handle cancel
        if (selection === "cancel") {
          collector.stop("cancelled");
          return i.update({
            embeds: [
              new EmbedBuilder()
                .setDescription("🛑 Search cancelled")
                .setColor(client.config.embedColor),
            ],
            components: [],
          });
        }

        try {
          // Get selected track
          const track = tracks[parseInt(selection)];

          // Add track to queue - Check if queue exists first
          if (!player.queue) {
            console.error("Player queue is undefined:", player);
            return i.update({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    "❌ Error connecting to voice channel. Please try again."
                  )
                  .setColor(client.config.embedColor),
              ],
              components: [],
            });
          }

          // Add the track to the queue
          player.queue.add(track);

          // Play if not already playing
          if (!player.playing && !player.paused) {
            await player.play();
          }

          // Update message
          i.update({
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
            components: [],
          });

          // Stop collector
          collector.stop("selected");
        } catch (error) {
          console.error("Error adding track to queue:", error);
          return i.update({
            embeds: [
              new EmbedBuilder()
                .setDescription(`❌ Error: ${error.message}`)
                .setColor(client.config.embedColor),
            ],
            components: [],
          });
        }
      });

      // Handle collector end
      collector.on("end", (_, reason) => {
        if (reason !== "selected" && reason !== "cancelled") {
          interaction
            .editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription("⏱️ Search timed out! Please try again.")
                  .setColor(client.config.embedColor),
              ],
              components: [],
            })
            .catch(() => {});
        }
      });
    } catch (error) {
      console.error("Error in search command:", error);
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
    const source =
      interaction.options.getString("source") || client.config.searchEngine;

    if (!focusedValue) return;

    try {
      // Search for tracks
      const results = await client.manager.search(focusedValue, {
        engine: source,
      });

      const choices = results.tracks
        .slice(0, client.config.autoCompleteLimit || 5)
        .map((track) => ({
          name:
            `${track.title} - ${track.author}`.length > 100
              ? `${track.title} - ${track.author}`.substring(0, 97) + "..."
              : `${track.title} - ${track.author}`,
          value: track.title,
        }));

      await interaction.respond(choices);
    } catch (error) {
      console.error("Error in search autocomplete:", error);
      await interaction.respond([{ name: focusedValue, value: focusedValue }]);
    }
  },
};
