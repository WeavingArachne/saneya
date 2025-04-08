const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const formatTime = require("../../utils/formatTime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("View the current music queue")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Page number of the queue")
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    const { guild } = interaction;
    const page = interaction.options.getInteger("page") || 1;

    const player = client.manager.players.get(guild.id);

    if (!player || !player.queue.current) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ No music is currently playing!")
            .setColor(client.config.embedColor),
        ],
        ephemeral: true,
      });
    }

    return sendQueueEmbed(interaction, client, player, page);
  },

  async buttonAction(interaction, client) {
    const { guild, customId, message } = interaction;
    const player = client.manager.players.get(guild.id);

    if (!player || !player.queue.current) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ No music is currently playing!")
            .setColor(client.config.embedColor),
        ],
        components: [],
      });
    }

    const [, action, currentPageStr] = customId.split(":"); // queue:next:2
    let page = parseInt(currentPageStr) || 1;

    const totalPages = Math.ceil(player.queue.length / 5) || 1;

    if (action === "first") page = 1;
    if (action === "prev") page = Math.max(page - 1, 1);
    if (action === "next") page = Math.min(page + 1, totalPages);
    if (action === "last") page = totalPages;

    return sendQueueEmbed(interaction, client, player, page, true);
  },
};

async function sendQueueEmbed(
  interaction,
  client,
  player,
  page,
  isUpdate = false
) {
  const { guild } = interaction;
  const queue = player.queue;
  const totalPages = Math.ceil(queue.length / 5) || 1;

  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  const pageStart = (page - 1) * 5;
  const pageEnd = pageStart + 5;

  const embed = new EmbedBuilder()
    .setColor(client.config.embedColor)
    .setTitle(`Queue for ${guild.name}`)
    .setThumbnail(player.queue.current.thumbnail);

  const current = player.queue.current;
  const filters = player.filters.length
    ? `Filters: ${player.filters.join(", ")}`
    : "";

  const duration = formatTime(current.length);
  const position = formatTime(player.position);

  embed.addFields({
    name: "📀 Now Playing",
    value: `[${current.title}](${current.uri}) \`[${position}/${duration}]\`\nRequested by: <@${current.requester.id}>\n${filters}`,
  });

  if (queue.length) {
    embed.addFields({
      name: "📑 Up Next",
      value: queue
        .slice(pageStart, pageEnd)
        .map(
          (track, index) =>
            `**${pageStart + index + 1}.** [${track.title}](${
              track.uri
            }) \`[${formatTime(track.length)}]\` • <@${track.requester.id}>`
        )
        .join("\n"),
    });
  } else {
    embed.addFields({
      name: "📑 Up Next",
      value: "No more songs in queue",
    });
  }

  embed.setFooter({
    text: `Page ${page} of ${totalPages} • ${queue.length} song(s) • Volume: ${
      player.volume
    }% • Loop: ${
      player.loop === "none"
        ? "Off"
        : player.loop === "track"
        ? "Track"
        : "Queue"
    }`,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`queue:first:${page}`)
      .setLabel("First")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),

    new ButtonBuilder()
      .setCustomId(`queue:prev:${page}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 1),

    new ButtonBuilder()
      .setCustomId(`queue:next:${page}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages),

    new ButtonBuilder()
      .setCustomId(`queue:last:${page}`)
      .setLabel("Last")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages)
  );

  if (isUpdate) {
    return interaction.update({
      embeds: [embed],
      components: [row],
    });
  } else {
    return interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });
  }
}
