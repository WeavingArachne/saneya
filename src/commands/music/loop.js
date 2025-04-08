const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Set the loop mode for the current queue")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Loop mode to set")
        .setRequired(false)
        .addChoices(
          { name: "Off", value: "none" },
          { name: "Track", value: "track" },
          { name: "Queue", value: "queue" }
        )
    ),

  async execute(interaction, client) {
    const { member, guild, options } = interaction;
    const mode = options.getString("mode");

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
            .setDescription("❌ There is no music playing in this server!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Check if the user is in the same voice channel as the bot
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

    // If no mode specified, toggle between modes
    if (!mode) {
      const currentLoop = player.loop;

      // Toggle in the order: none -> track -> queue -> none
      if (currentLoop === "none") {
        player.setLoop("track");
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("🔂 **Track** loop enabled!")
              .setColor(client.config.embedColor),
          ],
        });
      } else if (currentLoop === "track") {
        player.setLoop("queue");
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("🔁 **Queue** loop enabled!")
              .setColor(client.config.embedColor),
          ],
        });
      } else {
        player.setLoop("none");
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("➡️ Loop disabled!")
              .setColor(client.config.embedColor),
          ],
        });
      }
    }

    // Set the specified loop mode
    player.setLoop(mode);

    // Message based on loop mode
    let message;
    if (mode === "none") {
      message = "➡️ Loop disabled!";
    } else if (mode === "track") {
      message = "🔂 **Track** loop enabled!";
    } else if (mode === "queue") {
      message = "🔁 **Queue** loop enabled!";
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(message)
          .setColor(client.config.embedColor),
      ],
    });
  },

  // Button action handler
  async buttonAction(interaction, client) {
    const { member, guild } = interaction;

    // Get the player
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

    // Check if the user is in the same voice channel as the bot
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

    // Toggle loop mode
    const currentLoop = player.loop;
    let message;

    if (currentLoop === "none") {
      player.setLoop("track");
      message = "🔂 **Track** loop enabled!";
    } else if (currentLoop === "track") {
      player.setLoop("queue");
      message = "🔁 **Queue** loop enabled!";
    } else {
      player.setLoop("none");
      message = "➡️ Loop disabled!";
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(message)
          .setColor(client.config.embedColor),
      ],
      ephemeral: true,
    });
  },
};
