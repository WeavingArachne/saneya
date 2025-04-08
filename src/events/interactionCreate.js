// module.exports = {
//   name: "interactionCreate",
//   async execute(interaction, client) {
//     // Handle slash commands
//     if (interaction.isChatInputCommand()) {
//       const command = client.commands.get(interaction.commandName);

//       if (!command) return;

//       try {
//         await command.execute(interaction, client);
//       } catch (error) {
//         console.error(error);
//         await interaction
//           .reply({
//             content: "❌ There was an error while executing this command!",
//             ephemeral: true,
//           })
//           .catch(() => {});
//       }
//     }

//     // Handle autocomplete interactions
//     if (interaction.isAutocomplete()) {
//       const command = client.commands.get(interaction.commandName);

//       if (!command || !command.autocomplete) return;

//       try {
//         await command.autocomplete(interaction, client);
//       } catch (error) {
//         console.error(error);
//       }
//     }

//     // Handle button interactions
//     if (interaction.isButton()) {
//       // Extract the command part (before the first colon)
//       const commandPart = interaction.customId.split(":")[0];

//       switch (commandPart) {
//         case "pause":
//           require("../commands/music/pause").buttonAction(interaction, client);
//           break;
//         case "resume":
//           require("../commands/music/resume").buttonAction(interaction, client);
//           break;
//         case "skip":
//           require("../commands/music/skip").buttonAction(interaction, client);
//           break;
//         case "stop":
//           require("../commands/music/stop").buttonAction(interaction, client);
//           break;
//         case "loop":
//           require("../commands/music/loop").buttonAction(interaction, client);
//           break;
//         case "shuffle":
//           require("../commands/music/shuffle").buttonAction(
//             interaction,
//             client
//           );
//           break;
//         case "previous":
//           require("../commands/music/previous").buttonAction(
//             interaction,
//             client
//           );
//           break;
//         case "volup":
//           require("../commands/music/volume").buttonAction(
//             interaction,
//             client,
//             "up"
//           );
//           break;
//         case "voldown":
//           require("../commands/music/volume").buttonAction(
//             interaction,
//             client,
//             "down"
//           );
//           break;
//         case "queue":
//           require("../commands/music/queue").buttonAction(interaction, client);
//           break;
//         default:
//           break;
//       }
//     }
//   },
// };

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction
          .reply({
            content: "❌ There was an error while executing this command!",
            ephemeral: true,
          })
          .catch(() => {});
      }
    }

    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (!command || !command.autocomplete) return;

      try {
        await command.autocomplete(interaction, client);
      } catch (error) {
        console.error(error);
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      try {
        // Check for dashboard buttons first
        if (
          interaction.customId.startsWith("dashboard_") ||
          interaction.customId.startsWith("filter_")
        ) {
          console.log(`Dashboard button pressed: ${interaction.customId}`);
          const dashboardCommand = client.commands.get("dashboard");

          if (dashboardCommand) {
            await dashboardCommand.buttonAction(interaction, client);
            return;
          }
        }

        // Process other buttons using the existing switch statement
        // Extract the command part (before the first colon)
        const commandPart = interaction.customId.split(":")[0];

        switch (commandPart) {
          case "pause":
            require("../commands/music/pause").buttonAction(
              interaction,
              client
            );
            break;
          case "resume":
            require("../commands/music/resume").buttonAction(
              interaction,
              client
            );
            break;
          case "skip":
            require("../commands/music/skip").buttonAction(interaction, client);
            break;
          case "stop":
            require("../commands/music/stop").buttonAction(interaction, client);
            break;
          case "loop":
            require("../commands/music/loop").buttonAction(interaction, client);
            break;
          case "shuffle":
            require("../commands/music/shuffle").buttonAction(
              interaction,
              client
            );
            break;
          case "previous":
            require("../commands/music/previous").buttonAction(
              interaction,
              client
            );
            break;
          case "volup":
            require("../commands/music/volume").buttonAction(
              interaction,
              client,
              "up"
            );
            break;
          case "voldown":
            require("../commands/music/volume").buttonAction(
              interaction,
              client,
              "down"
            );
            break;
          case "queue":
            require("../commands/music/queue").buttonAction(
              interaction,
              client
            );
            break;
          default:
            // Handle unrecognized button
            console.log(
              `Unhandled button interaction: ${interaction.customId}`
            );
            break;
        }
      } catch (error) {
        console.error("Error handling button interaction:", error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: `❌ Error processing button: ${error.message}`,
              ephemeral: true,
            });
          }
        } catch (err) {
          console.error("Failed to respond to button error:", err);
        }
      }
    }
  },
};
