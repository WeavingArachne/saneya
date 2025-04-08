const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency."),

  async execute(interaction, client) {
    const sent = await interaction.reply({
      content: "🏓 Pinging...",
      fetchReply: true,
    });

    const ping = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(
      `🏓 Pong!\nClient Latency: ${ping}ms\nWebSocket Ping: ${client.ws.ping}ms`
    );
  },
};
