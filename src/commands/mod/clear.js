const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription(
      "Delete recent messages, with optional user filtering and protection."
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (max 100)")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Only delete messages from this user")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amountToDelete = interaction.options.getInteger("amount");
    const targetUser = interaction.options.getUser("user");
    const protectedUserIds = ["283697928932163595"]; // add more IDs if needed

    if (amountToDelete < 1 || amountToDelete > 100) {
      return interaction.reply({
        content: "⚠️ You must provide a number between 1 and 100.",
        ephemeral: true,
      });
    }

    const allMessages = await interaction.channel.messages.fetch({
      limit: 100,
    });
    let filtered = allMessages.filter((msg) => {
      // Skip protected users
      if (protectedUserIds.includes(msg.author.id)) return false;

      // If specific user, match their ID
      if (targetUser && msg.author.id !== targetUser.id) return false;

      // Skip old or undeletable messages
      const ageLimit =
        Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000;
      return msg.deletable && ageLimit;
    });

    // Trim to requested amount
    const deletable = filtered.first(amountToDelete);

    if (!deletable.length) {
      return interaction.reply({
        content: `❌ No deletable messages found${
          targetUser ? ` from ${targetUser.tag}` : ""
        }.`,
        ephemeral: true,
      });
    }

    await interaction.channel.bulkDelete(deletable, true);

    return interaction.reply({
      content: `🧹 Deleted ${deletable.length} message(s)${
        targetUser ? ` from ${targetUser.tag}` : ""
      }.`,
      ephemeral: true,
    });
  },
};
