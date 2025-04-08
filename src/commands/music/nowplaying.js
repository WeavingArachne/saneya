const { SlashCommandBuilder } = require("discord.js");
const PlayerEmbed = require("../../utils/PlayerEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show information about the currently playing song"),

  async execute(interaction, client) {
    const { guild } = interaction;

    // Get the player
    const player = client.manager.players.get(guild.id);

    if (!player || !player.queue.current) {
      return interaction.reply({
        embeds: [
          {
            description: "❌ No music is currently playing!",
            color: parseInt(client.config.embedColor.replace("#", ""), 16),
          },
        ],
        ephemeral: true,
      });
    }

    // Get player embed with control buttons
    const { embeds, components } = PlayerEmbed(player, client);

    return interaction.reply({
      embeds,
      components,
      fetchReply: true,
    });
  },

  // Handle button press (used in interactionCreate event)
  async buttonAction(interaction, client) {
    const { guild } = interaction;
    const player = client.manager.players.get(guild.id);

    if (!player || !player.queue.current) {
      return interaction.reply({
        embeds: [
          {
            description: "❌ No music is currently playing!",
            color: parseInt(client.config.embedColor.replace("#", ""), 16),
          },
        ],
        ephemeral: true,
      });
    }

    const { embeds, components } = PlayerEmbed(player, client);

    return interaction.update({
      embeds,
      components,
    });
  },
};
