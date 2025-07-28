require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
});

const token = process.env.TOKEN;

client.once('ready', () => console.log(`Bot aktif: ${client.user.tag}`));
client.login(token);
