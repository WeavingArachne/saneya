const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("previous")
    .setDescription("Play the previous track in the queue"),

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
            .setDescription("❌ No music is currently playing!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Check if user is in the same voice channel
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

    // Check if there's a previous track
    if (
      player.queue.previous.length == 0 ||
      player.queue.previous[0] === player.queue.current
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ There is no previous track to play!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    try {
      // Get previous track
      const previousTrack = player.queue.previous;

      // Create a reference to the track title before queue modification
      const trackTitle = previousTrack[0].title;
      // Pause the player to prevent potential issues
      await player.pause(true);

      // Clear the queue and add the previous track at the beginning
      // player.queue.clear();
      player.play(previousTrack[0]);

      // Skip the current track to force playing the previous track
      // await player.skip();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`⏮️ Playing previous track: **${trackTitle}**`)
            .setColor(client.config.embedColor),
        ],
      });
    } catch (error) {
      console.error("Error in previous command:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }
  },

  // Button action handler for previous button
  async buttonAction(interaction, client) {
    const { guild, member } = interaction;

    // Check if user is in a voice channel
    if (!member.voice.channel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You must be in a voice channel to use this button!"
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
            .setDescription("❌ No music is currently playing!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Check if user is in the same voice channel
    if (member.voice.channelId !== player.voiceId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "❌ You must be in the same voice channel as the bot to use this button!"
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Check if there's a previous track
    if (
      player.queue.previous.length == 0 ||
      player.queue.previous[0] === player.queue.current
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ There is no previous track to play!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    try {
      // Get previous track
      const previousTrack = player.queue.previous;
      // Create a reference to the track title before queue modification
      const trackTitle = previousTrack[0].title;
      // Pause the player to prevent potential issues
      await player.pause(true);

      // Clear the queue and add the previous track at the beginning
      // player.queue.clear();
      player.play(previousTrack[0]);

      // Skip the current track to force playing the previous track
      // await player.skip();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`⏮️ Playing previous track: **${trackTitle}**`)
            .setColor(client.config.embedColor),
        ],
      });
    } catch (error) {
      console.error("Error in previous button:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Error: ${error.message}`)
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }
  },
};

// const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("previous")
//     .setDescription("Play the previous track in the queue"),

//   async execute(interaction, client) {
//     const { guild, member } = interaction;

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
//             .setDescription("❌ No music is currently playing!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if user is in the same voice channel
//     if (member.voice.channelId !== player.voiceId) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               "❌ You must be in the same voice channel as the bot to use this command!"
//             )
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if there's a previous track

//     if (player.queue.previous == player.queue.current) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription("❌ There is no previous track to play!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     try {
//       // Add the current track to the beginning of the queue if it exists
//       if (player.queue.current) {
//         player.queue.unshift(player.queue.current);
//       }

//       // Set the previous track as the current track
//       player.queue.unshift(player.queue.previous);

//       // Skip to the now first track (which is the previous one)
//       await player.skip();

//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               `⏮️ Playing previous track: **${player.queue.current.title}**`
//             )
//             .setColor(client.config.embedColor),
//         ],
//       });
//     } catch (error) {
//       console.error("Error in previous command:", error);
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(`❌ Error: ${error.message}`)
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }
//   },

//   // Button action handler for previous button
//   async buttonAction(interaction, client) {
//     const { guild, member } = interaction;

//     // Check if user is in a voice channel
//     if (!member.voice.channel) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               "❌ You must be in a voice channel to use this button!"
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
//             .setDescription("❌ No music is currently playing!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if user is in the same voice channel
//     if (member.voice.channelId !== player.voiceId) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               "❌ You must be in the same voice channel as the bot to use this button!"
//             )
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     // Check if there's a previous track
//     if (!player.queue.previous) {
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription("❌ There is no previous track to play!")
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }

//     try {
//       // Add the current track to the beginning of the queue if it exists
//       if (player.queue.current) {
//         player.queue.unshift(player.queue.current);
//       }

//       // Set the previous track as the current track
//       player.queue.unshift(player.queue.previous);

//       // Skip to the now first track (which is the previous one)
//       await player.skip();

//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(
//               `⏮️ Playing previous track: **${player.queue.current.title}**`
//             )
//             .setColor(client.config.embedColor),
//         ],
//       });
//     } catch (error) {
//       console.error("Error in previous button:", error);
//       return interaction.reply({
//         embeds: [
//           new EmbedBuilder()
//             .setDescription(`❌ Error: ${error.message}`)
//             .setColor(client.config.embedColor),
//         ],
//         ephemeral: true,
//       });
//     }
//   },
// };
// const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("previous")
//     .setDescription("Play the previous track in the queue"),

//   async execute(interaction, client) {
//     await handlePrevious(interaction, client);
//   },

//   async buttonAction(interaction, client) {
//     await handlePrevious(interaction, client);
//   },
// };

// // Main handler function for both slash command and button
// async function handlePrevious(interaction, client) {
//   const { guild, member } = interaction;

//   const errorEmbed = (desc) =>
//     new EmbedBuilder()
//       .setDescription(`❌ ${desc}`)
//       .setColor(client.config.embedColor);

//   const player = client.manager.players.get(guild.id);

//   if (!member.voice.channel) {
//     return interaction.reply({
//       embeds: [errorEmbed("You must be in a voice channel!")],
//       ephemeral: true,
//     });
//   }

//   if (!player) {
//     return interaction.reply({
//       embeds: [errorEmbed("No music is currently playing!")],
//       ephemeral: true,
//     });
//   }

//   if (member.voice.channelId !== player.voiceId) {
//     return interaction.reply({
//       embeds: [errorEmbed("You must be in the same voice channel as the bot!")],
//       ephemeral: true,
//     });
//   }

//   if (!player.queue.previous) {
//     return interaction.reply({
//       embeds: [errorEmbed("There is no previous track to play!")],
//       ephemeral: true,
//     });
//   }

//   try {
//     // Play the previous track directly
//     await player.play(player.queue.previous);

//     return interaction.reply({
//       embeds: [
//         new EmbedBuilder()
//           .setDescription(
//             `⏮️ Playing previous track: **${player.queue.previous.title}**`
//           )
//           .setColor(client.config.embedColor),
//       ],
//     });
//   } catch (error) {
//     console.error("Error in previous command/button:", error);
//     return interaction.reply({
//       embeds: [errorEmbed(`Error: ${error.message}`)],
//       ephemeral: true,
//     });
//   }
// }
