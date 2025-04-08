module.exports = {
  /**
   * Bot settings
   */
  embedColor: process.env.BOT_EMBED_COLOR || "#3498db", // Color for embeds, defaults to #3498db if not set
  owner: [283697928932163595], // Array of Discord user IDs who are bot owners

  /**
   * Music settings
   */
  defaultVolume: 100, // Default player volume (1-100)
  maxVolume: 100, // Maximum allowed volume (1-100)
  stayInVc: false, // Whether the bot should stay in VC when queue is empty
  saveQueues: true, // Whether to save queues when the bot restarts

  /**
   * Playback settings
   */
  leaveOnEmpty: true, // Leave VC when everyone leaves
  leaveOnEnd: false, // Leave VC when queue ends
  leaveOnStop: false, // Leave VC when stop command is used

  /**
   * Voice channel settings
   */
  updateVoiceChannelName: false, // Whether to update voice channel name with current song

  /**
   * Filter settings
   */
  defaultFilters: [], // Default audio filters to apply

  /**
   * Song search settings
   */
  maxSearchResults: 10, // Maximum number of search results
  searchEngine: "youtube", // Default search engine

  /**
   * Available audio filters
   */
  filters: {
    bassboost: "Bass amplification",
    "8D": "8D audio effect",
    nightcore: "Faster with higher pitch",
    vaporwave: "Slower with lower pitch",
    echo: "Echo effect",
    karaoke: "Vocal suppression",
    tremolo: "Trembling effect",
    vibrato: "Vibrating effect",
    flanger: "Flanger effect",
    gate: "Gate effect",
    haas: "Spatial effect",
    mcompand: "Multiband compression",
    pulsator: "Pulsator effect",
    subboost: "Boost sub-bass",
    earwax: "Optimization for earphones",
    surround: "Surround sound effect",
    phaser: "Phaser effect",
    treble: "Treble amplification",
    normalizer: "Volume normalization",
    fadein: "Fade in effect",
    mono: "Mono sound",
    expander: "Expander effect",
    softlimiter: "Soft limiter",
    chorus: "Chorus effect",
    tempo: "Tempo adjustment",
  },

  /**
   * Auto-complete suggestions limit
   */
  autoCompleteLimit: 15,

  /**
   * Performance settings
   */
  emitNewSongOnly: true, // Emit new song events only when needed
  pruneMusic: true, // Clear music messages periodically
};
