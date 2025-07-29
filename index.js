require('dotenv').config();

const { Client, Intents } = require('discord.js');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.once('ready', () => {
  console.log('Bot aktif!'); // Konsola yazacak
});

client.login(process.env.DISCORD_TOKEN);
