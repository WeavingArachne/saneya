const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("247")
    .setDescription(
      "Toggle 24/7 mode to keep the bot in the voice channel indefinitely"
    ),

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

    // Get the player
    const player = client.manager.players.get(guild.id);

    if (!player) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ No music player found! Play something first.")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Check if user is in the same voice channel as the bot
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

    // Toggle 24/7 mode
    player.twentyFourSeven = !player.twentyFourSeven;

    // Store 24/7 status for the guild
    if (!client.twentyFourSeven) client.twentyFourSeven = new Map();
    client.twentyFourSeven.set(guild.id, player.twentyFourSeven);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `🔄 24/7 mode is now ${
              player.twentyFourSeven ? "**enabled**" : "**disabled**"
            }`
          )
          .setFooter({
            text: player.twentyFourSeven
              ? "The bot will now stay in the voice channel indefinitely."
              : "The bot will disconnect after inactivity.",
          })
          .setColor(client.config.embedColor),
      ],
    });
  },
};
