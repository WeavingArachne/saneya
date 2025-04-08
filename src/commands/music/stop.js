const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the music and clear the queue"),

  async execute(interaction, client) {
    const { member, guild } = interaction;

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

    // Check if the user is in the same voice channel as the bot
    if (member.voice.channelId !== player.voiceId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You must be in the same voice channel as me to use this command!"
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Clear the queue and stop the player
    player.queue.clear();
    player.skip();

    // Leave the voice channel if configured
    if (client.config.leaveOnStop) {
      player.destroy();
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("⏹️ Stopped the music and cleared the queue!")
          .setColor(client.config.embedColor),
      ],
    });
  },

  // Button action handler
  async buttonAction(interaction, client) {
    const { member, guild } = interaction;

    // Get the player
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

    // Check if the user is in the same voice channel as the bot
    if (!member.voice.channel || member.voice.channelId !== player.voiceId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You must be in the same voice channel as me to use this control!"
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Clear the queue and stop the player
    player.queue.clear();
    player.skip();

    // Leave the voice channel if configured
    if (client.config.leaveOnStop) {
      player.destroy();
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("⏹️ Stopped the music and cleared the queue!")
          .setColor(client.config.embedColor),
      ],
      ephemeral: true,
    });
  },
};
