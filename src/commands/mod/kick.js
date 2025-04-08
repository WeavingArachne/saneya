// const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("kick")
//     .setDescription("Kick a member from the server.")
//     .addUserOption((option) =>
//       option
//         .setName("user")
//         .setDescription("The user to kick")
//         .setRequired(true)
//     )
//     .addStringOption((option) =>
//       option
//         .setName("reason")
//         .setDescription("Reason for kicking")
//         .setRequired(false)
//     )
//     .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

//   async execute(interaction) {
//     const user = interaction.options.getUser("user");
//     const senderId = interaction.user.id;
//     const reason =
//       interaction.options.getString("reason") || "No reason provided";
//     const member = interaction.guild.members.cache.get(user.id);

//     if (!member) {
//       return interaction.reply({
//         content: "❌ User not found in this server.",
//         ephemeral: true,
//       });
//     }
//     if (user.id === interaction.client.user.id) {
//       return interaction.reply({
//         content: "❌ You cannot ban me!🥹",
//         ephemeral: true,
//       });
//     }
//     if (user.id === senderId) {
//       return interaction.reply({
//         content: "Trying to kick yourself??!😂😂",
//         ephemeral: true,
//       });
//     }
//     if (senderId == "402578688106823681" && user.id === "283697928932163595") {
//       return interaction.reply({
//         content: "بتحاول تعملي كيك بي البوت بتاعي يا عرص",
//         ephemeral: true,
//       });
//     }
//     if (user.id === "283697928932163595") {
//       // Check if the user is trying to ban the owner of the bot (if you want to avoid banning yourself)
//       return interaction.reply({
//         content: "❌ You can't ban my owner 🙂",
//         ephemeral: true,
//       });
//     }
//     if (!member.kickable) {
//       return interaction.reply({
//         content: "❌ I can't kick this member (they might be above me).",
//         ephemeral: true,
//       });
//     }

//     try {
//       await member.kick(reason);
//       return interaction.reply(
//         `✅ ${user.tag} was kicked.\n📄 Reason: ${reason}`
//       );
//     } catch (error) {
//       console.error(error);
//       return interaction.reply({
//         content: "❌ Failed to kick the member.",
//         ephemeral: true,
//       });
//     }
//   },
// };

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for kicking")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const senderId = interaction.user.id;
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return interaction.reply({
        content: "❌ User not found in this server.",
        ephemeral: true,
      });
    }

    // Prevent trying to kick the bot itself
    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: "❌ You cannot ban me!🥹",
        ephemeral: true,
      });
    }

    // Prevent trying to kick the person invoking the command
    if (user.id === senderId) {
      return interaction.reply({
        content: "Trying to kick yourself??!😂😂",
        ephemeral: true,
      });
    }

    // Special case for bot owner, if needed
    if (senderId == "402578688106823681" && user.id === "283697928932163595") {
      return interaction.reply({
        content: "بتحاول تعملي كيك بي البوت بتاعي يا عرص",
        ephemeral: true,
      });
    }

    // Prevent trying to kick the bot owner
    if (user.id === "283697928932163595") {
      return interaction.reply({
        content: "❌ You can't ban my owner 🙂",
        ephemeral: true,
      });
    }

    // Check if the user has permission to kick the member
    if (!member.kickable) {
      return interaction.reply({
        content: "❌ I can't kick this member (they might be above me).",
        ephemeral: true,
      });
    }

    // Role hierarchy check to prevent kicking higher-ranked members
    if (
      member.roles.highest.position >= interaction.member.roles.highest.position
    ) {
      return interaction.reply({
        content: "❌ You cannot kick a member with a higher or equal role.",
        ephemeral: true,
      });
    }

    try {
      // Perform the kick
      await member.kick(reason);
      return interaction.reply(
        `✅ ${user.tag} was kicked.\n📄 Reason: ${reason}`
      );
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "❌ Failed to kick the member.",
        ephemeral: true,
      });
    }
  },
};
