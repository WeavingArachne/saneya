// const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("help")
//     .setDescription(
//       "Get detailed information about a command or list all commands."
//     )
//     .addStringOption((option) =>
//       option
//         .setName("command")
//         .setDescription("The command you want help with")
//         .setRequired(false)
//     ),

//   async execute(interaction, client) {
//     const commandName = interaction.options.getString("command");

//     if (commandName) {
//       // If a command is provided, show specific help for that command
//       const command = client.commands.get(commandName);

//       if (!command) {
//         return interaction.reply({
//           content: `❌ No command found with the name **${commandName}**.`,
//           ephemeral: true,
//         });
//       }

//       const embed = new EmbedBuilder()
//         .setColor(client.config.embedColor)
//         .setTitle(`Command: /${command.data.name}`)
//         .setDescription(command.data.description)
//         .addFields({
//           name: "Usage:",
//           value: `/${command.data.name} ${command.data.options
//             .map((opt) => opt.name)
//             .join(" ")}`,
//         })
//         .setFooter({ text: "Use this command to get more help." });

//       return interaction.reply({ embeds: [embed], ephemeral: true });
//     }

//     // If no command is provided, list all commands
//     const commands = client.commands.map((command) => {
//       return `**/${command.data.name}**: ${command.data.description}`;
//     });

//     // Function to chunk an array into smaller parts, each with a max length of 1024 characters
//     function chunkArray(array, maxLength) {
//       const chunks = [];
//       let currentChunk = [];
//       let currentLength = 0;

//       array.forEach((command) => {
//         if (currentLength + command.length + 1 <= maxLength) {
//           currentChunk.push(command);
//           currentLength += command.length + 1;
//         } else {
//           chunks.push(currentChunk);
//           currentChunk = [command];
//           currentLength = command.length + 1;
//         }
//       });

//       if (currentChunk.length > 0) {
//         chunks.push(currentChunk);
//       }

//       return chunks;
//     }

//     // Chunk the commands into smaller parts (each part will be under the 1024 character limit)
//     const commandChunks = chunkArray(commands, 1024);

//     // Send each chunk in a separate embed
//     for (let i = 0; i < commandChunks.length; i++) {
//       const helpEmbed = new EmbedBuilder()
//         .setColor(client.config.embedColor)
//         .setTitle("Bot Commands List")
//         .setDescription("Here are all the available commands you can use:")
//         .addFields({
//           name: `Commands (Page ${i + 1} of ${commandChunks.length})`,
//           value: commandChunks[i].join("\n"),
//         })
//         .setFooter({
//           text: "Use `/help <command_name>` for more info on a specific command.",
//         });

//       // Send the embed
//       await interaction.reply({
//         embeds: [helpEmbed],
//         ephemeral: true, // You can remove this if you want to make it public
//       });

//       // Add a delay to prevent rate limiting (if sending multiple embeds)
//       if (i < commandChunks.length - 1) {
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust delay as necessary
//       }
//     }
//   },
// };

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Get detailed information about a command or list all commands."
    )
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command you want help with")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const commandName = interaction.options.getString("command");

    if (commandName) {
      // If a command is provided, show specific help for that command
      const command = client.commands.get(commandName);

      if (!command) {
        return interaction.reply({
          content: `❌ No command found with the name **${commandName}**.`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`Command: /${command.data.name}`)
        .setDescription(command.data.description)
        .addFields({
          name: "Usage:",
          value: `/ ${command.data.name}`,
        })
        .setFooter({ text: "Use this command to get more help." });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // If no command is provided, list all commands
    const commands = client.commands.map((command) => {
      return `**/${command.data.name}**: ${command.data.description}`;
    });

    // Function to chunk an array into smaller parts, each with a max length of 1024 characters
    function chunkArray(array, maxLength) {
      const chunks = [];
      let currentChunk = [];
      let currentLength = 0;

      array.forEach((command) => {
        if (currentLength + command.length + 1 <= maxLength) {
          currentChunk.push(command);
          currentLength += command.length + 1;
        } else {
          chunks.push(currentChunk);
          currentChunk = [command];
          currentLength = command.length + 1;
        }
      });

      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      return chunks;
    }

    // Chunk the commands into smaller parts (each part will be under the 1024 character limit)
    const commandChunks = chunkArray(commands, 1024);

    // Create the first page of help commands and send the initial reply
    const helpEmbed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle("Bot Commands List")
      .setDescription("Here are all the available commands you can use:")
      .addFields({
        name: `Commands (Page 1 of ${commandChunks.length})`,
        value: commandChunks[0].join("\n"),
      })
      .setFooter({
        text: "Use `/help <command_name>` for more info on a specific command.",
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previous1")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true), // Disable the previous button initially
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
    );

    const replyMessage = await interaction.reply({
      embeds: [helpEmbed],
      components: [row],
      ephemeral: true, // You can remove this if you want to make it public
      fetchReply: true, // Fetch the sent message so we can edit it later
    });

    let currentPage = 0;

    // Collect button interactions and update the message accordingly
    const filter = (buttonInteraction) =>
      buttonInteraction.user.id === interaction.user.id; // Only allow the user who invoked the command

    const collector = replyMessage.createMessageComponentCollector({
      filter,
      time: 60000, // The collector will expire after 1 minute
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "next") {
        currentPage++;
      } else if (buttonInteraction.customId === "previous1") {
        currentPage--;
      }

      // Update the embed with the new page
      const pageEmbed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("Bot Commands List")
        .setDescription("Here are all the available commands you can use:")
        .addFields({
          name: `Commands (Page ${currentPage + 1} of ${commandChunks.length})`,
          value: commandChunks[currentPage].join("\n"),
        })
        .setFooter({
          text: "Use `/help <command_name>` for more info on a specific command.",
        });

      // Disable buttons if we are on the first or last page
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("previous1")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === commandChunks.length - 1)
      );

      // Edit the reply with the updated embed and action row
      await buttonInteraction.update({
        embeds: [pageEmbed],
        components: [updatedRow],
      });

      buttonInteraction.deferUpdate();
    });

    collector.on("end", () => {
      // Disable the buttons after the collector ends (1 minute timeout)
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("previous1")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      replyMessage.edit({ components: [disabledRow] });
    });
  },
};
