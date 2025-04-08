const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for banning")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const senderId = interaction.user.id;
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: "❌ You cannot ban me!🥹",
        ephemeral: true,
      });
    }
    if (user.id === senderId) {
      return interaction.reply({
        content: "Trying to kick yourself??!😂😂",
        ephemeral: true,
      });
    }
    if (senderId == "402578688106823681" && user.id === "283697928932163595") {
      return interaction.reply({
        content: "بتحاول تعملي بان بي البوت بتاعي يا عرص",
        ephemeral: true,
      });
    }
    if (user.id === "283697928932163595") {
      // Check if the user is trying to ban the owner of the bot (if you want to avoid banning yourself)
      return interaction.reply({
        content: "❌ You can't ban my owner 🙂",
        ephemeral: true,
      });
    }

    try {
      // Try banning the user
      await interaction.guild.members.ban(user.id, { reason });
      return interaction.reply(
        `✅ ${user.tag} was banned.\n📄 Reason: ${reason}`
      );
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content:
          "❌ Failed to ban the member. I might lack permissions or they’re not in the server.",
        ephemeral: true,
      });
    }
  },
};
