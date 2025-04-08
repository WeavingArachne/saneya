const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require("discord.js");
const { Kazagumo, Plugins } = require("kazagumo");
const Spotify = require("kazagumo-spotify");
const { Connectors } = require("shoukaku");
const { resolve } = require("path");
const fs = require("fs");
require("dotenv").config();

/**
 * Custom Discord client for music bot functionality
 */
class MusicClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message],
      allowedMentions: {
        parse: ["users", "roles"],
        repliedUser: false,
      },
    });

    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.config = require("../config");
    this.prefix = process.env.PREFIX || "!";
    this.initTime = Date.now();
    this.twentyFourSeven = new Map(); // Store 24/7 mode status for each guild

    // Initialize Kazagumo (Lavalink wrapper)
    this.manager = new Kazagumo(
      {
        defaultSearchEngine: "youtube",
        send: (guildId, payload) => {
          const guild = this.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
        plugins: [
          new Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            playlistPageLimit: 100,
            albumPageLimit: 50,
            searchLimit: 20,
          }),
          new Plugins.PlayerMoved(this),
          // new Plugins.PlayerAutoConnect(this),
        ],
      },
      new Connectors.DiscordJS(this),
      [
        {
          name: "Main",
          url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
          auth: process.env.LAVALINK_PASSWORD,
          secure: false,
        },
      ]
    );

    this.setupEventListeners();
  }

  /**
   * Load all command files
   */
  loadCommands() {
    const commandFolders = fs.readdirSync(resolve(__dirname, "../commands"));
    console.log("📂 Found command folders:", commandFolders);
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(resolve(__dirname, `../commands/${folder}`))
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const command = require(resolve(
          __dirname,
          `../commands/${folder}/${file}`
        ));
        this.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
      }
    }
  }

  /**
   * Load all event handlers
   */
  loadEvents() {
    const eventFiles = fs
      .readdirSync(resolve(__dirname, "../events"))
      .filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      const event = require(resolve(__dirname, `../events/${file}`));
      if (event.once) {
        this.once(event.name, (...args) => event.execute(...args, this));
      } else {
        this.on(event.name, (...args) => event.execute(...args, this));
      }
      console.log(`✅ Loaded event: ${event.name}`);
    }
  }

  /**
   * Setup Kazagumo (Lavalink) event listeners
   */
  setupEventListeners() {
    this.manager.on("playerStart", (player, track) => {
      const channel = this.channels.cache.get(player.textId);
      if (channel) {
        channel.send({
          embeds: [
            {
              title: "🎵 Now Playing",
              description: `**[${track.title}](${track.uri})**`,
              fields: [
                { name: "Artist", value: track.author, inline: true },
                {
                  name: "Duration",
                  value: this.formatDuration(track.length),
                  inline: true,
                },
                {
                  name: "Requested By",
                  value: `<@${track.requester.id}>`,
                  inline: true,
                },
              ],
              thumbnail: { url: track.thumbnail },
              color: parseInt(
                process.env.BOT_EMBED_COLOR?.replace("#", "0x") || "0x3498db",
                16
              ),
            },
          ],
        });

        // Update VC name
        if (this.config.updateVoiceChannelName && player.voiceId) {
          const voiceChannel = this.channels.cache.get(player.voiceId);
          if (
            voiceChannel &&
            voiceChannel.permissionsFor(this.user.id).has("MANAGE_CHANNELS")
          ) {
            const shortTitle =
              track.title.length > 14
                ? `${track.title.substring(0, 14)}...`
                : track.title;
            voiceChannel.setName(`🎵 | ${shortTitle}`).catch(() => {});
          }
        }
      }
    });

    this.manager.on("playerEnd", (player) => {
      if (this.config.updateVoiceChannelName && player.voiceId) {
        const voiceChannel = this.channels.cache.get(player.voiceId);
        if (
          voiceChannel &&
          voiceChannel.permissionsFor(this.user.id).has("MANAGE_CHANNELS")
        ) {
          voiceChannel.setName(`🔈 Music Channel`).catch(() => {});
        }
      }
    });

    this.manager.on("playerEmpty", (player) => {
      const channel = this.channels.cache.get(player.textId);

      // Check if 24/7 mode is enabled for this guild
      const twentyFourSeven = this.twentyFourSeven.get(player.guildId) || false;

      if (channel) {
        channel.send({
          embeds: [
            {
              description: twentyFourSeven
                ? "⏹️ Queue ended! Staying in voice channel (24/7 mode is enabled)."
                : "⏹️ Queue ended! Left the voice channel.",
              color: parseInt(
                process.env.BOT_EMBED_COLOR?.replace("#", "0x") || "0x3498db",
                16
              ),
            },
          ],
        });
      }

      // Only destroy if not in 24/7 mode and stayInVc is false
      if (!twentyFourSeven && !this.config.stayInVc) {
        player.destroy();
      }
    });

    this.manager.on("playerException", (player, error) => {
      console.error(`❗ Player Exception: ${error.message}`);
      const channel = this.channels.cache.get(player.textId);
      if (channel) {
        channel.send({
          embeds: [
            {
              description:
                "❌ An error occurred while playing this track! Skipping to the next one...",
              color: 0xff0000,
            },
          ],
        });
      }
      player.skip();
    });
  }

  /**
   * Format milliseconds to MM:SS format
   */
  formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Start the bot
   */
  async start() {
    this.loadCommands();
    this.loadEvents();
    await this.login(process.env.TOKEN);
  }
}

module.exports = MusicClient;
