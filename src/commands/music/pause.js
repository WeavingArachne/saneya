// const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("pause")
//     .setDescription("Pause the currently playing music"),

//   async execute(interaction, client) {
//     const { member, guild } = interaction;

//     // Check if user is in a voice channel
//     if (!member.voice.channel) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               "❌ You must be in a voice channel to use this command!"
//             )
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Get the player
//     const player = client.manager.players.get(guild.id);
//     if (!player) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription("❌ There is no music playing in this server!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if the user is in the same voice channel as the bot
//     if (member.voice.channelId !== player.voiceId) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               "❌ You must be in the same voice channel as me to use this command!"
//             )
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if the player is already paused
//     if (player.paused) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription("⚠️ The music is already paused!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Pause the player
//     player.pause(true);

//     return interaction.reply({
//       embeds: [
//         new EmbedBuilder()
//           .setDescription("⏸️ Paused the music!")
//           .setColor(client.config.embedColor),
//       ],
//     });
//   },

//   // Button action handler
//   async buttonAction(interaction, client) {
//     const { member, guild } = interaction;

//     // Get the player
//     const player = client.manager.players.get(guild.id);
//     if (!player) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription("❌ There is no music playing in this server!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if the user is in the same voice channel as the bot
//     if (!member.voice.channel || member.voice.channelId !== player.voiceId) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               "❌ You must be in the same voice channel as me to use this control!"
//             )
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if the player is already paused
//     if (player.paused) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription("⚠️ The music is already paused!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Pause the player
//     player.pause(true);

//     return interaction.reply({
//       embeds: [
//         new EmbedBuilder()
//           .setDescription("⏸️ Paused the music!")
//           .setColor(client.config.embedColor),
//       ],
//       ephemeral: true,
//     });
//   },
// };

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const generatePlayerEmbed = require("../../utils/PlayerEmbed"); // Adjust path if needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the currently playing music"),

  async execute(interaction, client) {
    const { member, guild } = interaction;

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

    if (player.paused) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("⚠️ The music is already paused!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    player.pause(true);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("⏸️ Paused the music!")
          .setColor(client.config.embedColor),
      ],
    });
  },

  // BUTTON ACTION HANDLER
  async buttonAction(interaction, client) {
    const { member, guild } = interaction;

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

    if (player.paused) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("⚠️ The music is already paused!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    player.pause(true);

    // Refresh UI with updated embed and buttons
    const updated = generatePlayerEmbed(player, client);

    return interaction.update({
      embeds: updated.embeds,
      components: updated.components,
    });
  },
};
