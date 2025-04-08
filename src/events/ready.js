const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ ${client.user.tag} is online and ready!`);

    // Set the bot's status
    client.user.setActivity("⎛⎝ ≽ > ⩊ < ≼ ⎠⎞", {
      type: ActivityType.Listening,
    });

    // Register slash commands
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord.js");

    const commands = [];
    client.commands.forEach((command) => {
      commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    (async () => {
      try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
          body: commands,
        });

        console.log("Successfully reloaded application (/) commands.");
      } catch (error) {
        console.error(error);
      }
    })();
  },
};
