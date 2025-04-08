/**
 * ReMusic Discord Music Bot
 * A music bot using Discord.js v14 & Lavalink v4 with support for
 * YouTube, Spotify, SoundCloud, and more!
 */

// Import the custom client
const MusicClient = require("./src/structures/Client");
const path = require("path");

// Create a new client instance
const client = new MusicClient();

// Register process event handlers
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// Start the bot
client.start().catch(console.error);

const express = require("express");
const app = express();
const port = 3000;
app.get("/", (req, res) => {
  const imagePath = path.join(__dirname, "index.html");
  res.sendFile(imagePath);
});
app.listen(port, () => {
  console.log(`[ PORT ]http://localhost:${port}`);
});

// Export the client for other modules
module.exports = client;
