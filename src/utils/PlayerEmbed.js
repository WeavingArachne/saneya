const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

/**
 * Create a music player embed with controls
 * @param {import('kazagumo').Player} player The Kazagumo player instance
 * @param {import('discord.js').Client} client The Discord client
 * @returns {Object} Object containing embed and components
 */
module.exports = (player, client) => {
  if (!player || !player.queue.current) {
    return {
      embeds: [
        new EmbedBuilder()
          .setDescription("❌ No music is currently playing.")
          .setColor(client.config.embedColor),
      ],
      components: [],
    };
  }

  const track = player.queue.current;

  // Calculate progress bar
  const duration = track.length;
  const position = player.position;
  const progress = Math.floor((position / duration) * 15);
  const progressBar = "▬".repeat(progress) + "🔘" + "▬".repeat(15 - progress);

  // Format timestamps
  const formatTime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Create music embed
  const embed = new EmbedBuilder()
    .setTitle(`🎵 Now Playing`)
    .setDescription(`**[${track.title}](${track.uri})**`)
    .addFields(
      { name: "Artist", value: track.author, inline: true },
      { name: "Requested By", value: `<@${track.requester.id}>`, inline: true },
      { name: "Volume", value: `${player.volume}%`, inline: true },
      {
        name: "Duration",
        value: `${formatTime(position)} ${progressBar} ${formatTime(duration)}`,
        inline: false,
      }
    )
    .setThumbnail(track.thumbnail)
    .setColor(client.config.embedColor)
    .setFooter({
      text: `Queue: ${player.queue.length} song(s) • Loop: ${
        player.loop === "none"
          ? "Off"
          : player.loop === "track"
          ? "Track"
          : "Queue"
      }`,
    });

  // Create control buttons
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("previous")
      .setEmoji("⏮️")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(player.paused ? "resume" : "pause")
      .setEmoji(player.paused ? "▶️" : "⏸️")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voldown")
      .setEmoji("🔉")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("loop")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("shuffle")
      .setEmoji("🔀")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("volup")
      .setEmoji("🔊")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("queue")
      .setEmoji("📜")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row1, row2],
  };
};
