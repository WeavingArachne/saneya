const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Skip to a specific position in the queue")
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    const { guild, member } = interaction;
    const position = interaction.options.getInteger("position");

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

    // Get the player
    const player = client.manager.players.get(guild.id);

    if (!player || !player.queue.current) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ No music is currently playing!")
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
              "❌ You must be in the same voice channel as the bot to use this command!"
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    const currentSong = player.queue.current;

    try {
      if (position) {
        // Skip to a specific position in the queue
        if (position > player.queue.length) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `❌ Invalid position! The queue only has ${player.queue.length} songs.`
                )
                .setColor(client.config.embedColor),
            ],
            ephemeral: true,
          });
        }

        const trackToSkipTo = player.queue[position - 1];

        // Remove all tracks before the specified position
        player.queue.splice(0, position - 1);

        // Skip the current track to start playing the requested one
        player.skip();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `⏭️ Skipped to **[${trackToSkipTo.title}](${trackToSkipTo.uri})**!`
              )
              .setColor(client.config.embedColor),
          ],
        });
      } else {
        // Just skip the current song
        player.skip();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `⏭️ Skipped **[${currentSong.title}](${currentSong.uri})**!`
              )
              .setColor(client.config.embedColor),
          ],
        });
      }
    } catch (error) {
      console.error("Error in skip command:", error);
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

  // Handle button press (used in interactionCreate event)
  async buttonAction(interaction, client) {
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

    // Get the player
    const player = client.manager.players.get(guild.id);

    if (!player || !player.queue.current) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ No music is currently playing!")
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
              "❌ You must be in the same voice channel as the bot to use this command!"
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    const currentSong = player.queue.current;

    try {
      player.skip();
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⏭️ Skipped **[${currentSong.title}](${currentSong.uri})**!`
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in skip button action:", error);
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
};
