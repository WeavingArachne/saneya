const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("filter")
    .setDescription("Apply audio filters to the music.")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Filter to apply")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("reset")
        .setDescription("Reset all filters")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const { guild, member } = interaction;
    const filter = interaction.options.getString("type");
    const resetFilters = interaction.options.getBoolean("reset") || false;

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
    console.log(player.shoukaku);

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

    await interaction.deferReply();

    try {
      if (resetFilters) {
        // Reset all filters
        await player.clearFilters();

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription("🔄 All filters have been reset!")
              .setColor(client.config.embedColor),
          ],
        });
      }

      if (!client.config.filters[filter]) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `❌ Invalid filter! Use autocomplete to see available filters.`
              )
              .setColor(client.config.embedColor),
          ],
        });
      }

      // Toggle filter
      if (player.filters[filter]) {
        // Remove filter if it's already active
        await player.shoukaku.setFilters({ [filter]: false });

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`📉 Filter \`${filter}\` has been disabled.`)
              .setColor(client.config.embedColor),
          ],
        });
      } else {
        // Apply filter
        await player.shoukaku.setFilters({ [filter]: true });

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `📈 Filter \`${filter}\` (${client.config.filters[filter]}) has been applied!`
              )
              .setColor(client.config.embedColor),
          ],
        });
      }
    } catch (error) {
      console.error("Error in filter command:", error);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error applying filter: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
      });
    }
  },

  async autocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const choices = Object.keys(client.config.filters)
      .filter((filter) => filter.toLowerCase().includes(focusedValue))
      .map((filter) => ({
        name: `${filter} - ${client.config.filters[filter]}`,
        value: filter,
      }));

    await interaction.respond(choices.slice(0, 25));
  },

  async buttonAction(interaction, client) {
    // Only accessible as a slash command to avoid issues with filter selection
    await interaction.reply({
      content: "Please use the /filter command to apply audio filters.",
      ephemeral: true,
    });
  },
};
