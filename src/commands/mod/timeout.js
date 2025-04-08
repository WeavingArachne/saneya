// const { SlashCommandBuilder } = require("discord.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("timeout")
//     .setDescription("Timeout a member for a specified duration.")
//     .addUserOption((option) =>
//       option
//         .setName("user")
//         .setDescription("The user to timeout")
//         .setRequired(true)
//     )
//     .addIntegerOption((option) =>
//       option
//         .setName("duration")
//         .setDescription("Duration in seconds for the timeout")
//         .setRequired(true)
//     ),

//   async execute(interaction) {
//     const user = interaction.options.getUser("user");
//     const senderId = interaction.user.id;
//     const duration = interaction.options.getInteger("duration"); // Duration in seconds

//     // Ensure the user is not trying to timeout themselves
//     if (user.id === interaction.user.id) {
//       return interaction.reply({
//         content: "❌ You cannot timeout yourself!",
//         ephemeral: true,
//       });
//     }
//     if (user.id === interaction.client.user.id) {
//       return interaction.reply({
//         content: "❌ You cannot timeout me!🥹",
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
//         content: "بتحاول تعملي تيم اوت بي البوت بتاعي يا عرص",
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
//     try {
//       const member = await interaction.guild.members.fetch(user.id);

//       // Apply timeout to the user
//       await member.timeout(duration * 1000, "Timed out by bot command"); // Duration in milliseconds

//       return interaction.reply({
//         content: `${user.tag} has been timed out for ${duration} seconds.`,
//       });
//     } catch (error) {
//       console.error(error);
//       return interaction.reply({
//         content:
//           "❌ There was an error applying the timeout. I might lack permissions.",
//         ephemeral: true,
//       });
//     }
//   },
// };

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member for a specified duration.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to timeout")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration in seconds for the timeout")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers), // Ensure the user has the proper permission

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const senderId = interaction.user.id;
    const duration = interaction.options.getInteger("duration"); // Duration in seconds

    // Ensure the user is not trying to timeout themselves
    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ You cannot timeout yourself!",
        ephemeral: true,
      });
    }

    // Prevent the bot from being timed out
    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: "❌ You cannot timeout me!🥹",
        ephemeral: true,
      });
    }

    // Prevent the user from timing themselves out
    if (user.id === senderId) {
      return interaction.reply({
        content: "Trying to timeout yourself??!😂😂",
        ephemeral: true,
      });
    }

    // Special case: bot owner check
    if (senderId == "402578688106823681" && user.id === "283697928932163595") {
      return interaction.reply({
        content: "بتحاول تعملي تيم اوت بي البوت بتاعي يا عرص",
        ephemeral: true,
      });
    }

    // Prevent trying to timeout the bot owner
    if (user.id === "283697928932163595") {
      return interaction.reply({
        content: "❌ You can't timeout my owner 🙂",
        ephemeral: true,
      });
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);

      // Role hierarchy check
      if (
        member.roles.highest.position >=
        interaction.member.roles.highest.position
      ) {
        return interaction.reply({
          content:
            "❌ You cannot timeout a member with a higher or equal role.",
          ephemeral: true,
        });
      }

      // Apply timeout to the user
      await member.timeout(duration * 1000, "Timed out by bot command"); // Duration in milliseconds

      return interaction.reply({
        content: `${user.tag} has been timed out for ${duration} seconds.`,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content:
          "❌ There was an error applying the timeout. I might lack permissions.",
        ephemeral: true,
      });
    }
  },
};
