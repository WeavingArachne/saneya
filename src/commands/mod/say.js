const { SlashCommandBuilder } = require("discord.js");
const googleTTS = require("google-tts-api");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot speak a text in a chosen language.")
    .addStringOption((option) =>
      option.setName("text").setDescription("Text to speak").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("Language for speech (e.g. 'en', 'ar', 'ja')")
        .setRequired(false)
        .addChoices(
          { name: "English", value: "en" },
          { name: "Arabic", value: "ar" },
          { name: "Japanese", value: "ja" }
        )
    ),

  async execute(interaction) {
    const text = interaction.options.getString("text");
    const language = interaction.options.getString("language") || "en"; // Default to English if no language is provided

    // Ensure the bot is in a voice channel
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({
        content: "❌ You must join a voice channel first!",
        ephemeral: true,
      });
    }

    // Create a connection to the voice channel
    const connection = joinVoiceChannel({
      channelId: member.voice.channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    // Generate Google TTS URL with the specified language
    const url = googleTTS.getAudioUrl(text, {
      lang: language, // Use the selected language
      slow: false,
      host: "https://translate.google.com",
    });

    // Create an audio player
    const player = createAudioPlayer();

    // Create audio resource from the TTS URL
    const resource = createAudioResource(url);

    // Play the audio resource
    player.play(resource);

    // Subscribe the player to the connection
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy(); // Disconnect after playing
    });

    // Handle player errors
    player.on("error", (error) => {
      console.error(error);
      interaction.reply("❌ There was an error while trying to speak.");
    });

    // Reply to the user that the bot is speaking
    interaction.reply(
      `🎤 Speaking: "${text}" in ${
        language === "en"
          ? "English"
          : language === "ar"
          ? "Arabic"
          : "Japanese"
      }`
    );
  },
};
