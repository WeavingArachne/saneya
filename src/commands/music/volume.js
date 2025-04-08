const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Adjust the music volume")
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("Volume level (1-100)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction, client) {
    const { member, guild, options } = interaction;
    const volume = options.getInteger("level");

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

    // If no volume specified, display current volume
    if (!volume) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`🔊 Current volume: **${player.volume}%**`)
            .setColor(client.config.embedColor),
        ],
      });
    }

    // Check if the volume is within allowed range
    if (volume > client.config.maxVolume) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `❌ The maximum volume you can set is **${client.config.maxVolume}%**!`
            )
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    // Set the volume
    player.setVolume(volume);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`🔊 Volume set to **${volume}%**`)
          .setColor(client.config.embedColor),
      ],
    });
  },

  // Button action for volume controls
  async buttonAction(interaction, client, action) {
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

    // Calculate new volume based on action
    const currentVolume = player.volume;
    let newVolume;

    if (action === "up") {
      newVolume = Math.min(currentVolume + 10, client.config.maxVolume);
    } else if (action === "down") {
      newVolume = Math.max(currentVolume - 10, 0);
    }

    // Set the volume
    player.setVolume(newVolume);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `🔊 Volume ${
              action === "up" ? "increased" : "decreased"
            } to **${newVolume}%**`
          )
          .setColor(client.config.embedColor),
      ],
      ephemeral: true,
    });
  },
};
