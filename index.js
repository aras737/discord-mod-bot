require('dotenv').config();
const { Client, Intents } = require('discord.js');
const fs = require('fs');

let config = {};
try {
  const data = fs.readFileSync('./config.json', 'utf8');
  config = JSON.parse(data);
} catch (error) {
  console.warn('⚠️ config.json okunamadı veya geçersiz JSON, varsayılan değerler kullanılacak.');
}

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.once('ready', () => {
  console.log('Bot aktif!');
});

client.on('error', (error) => {
  console.error('Discord Client Error:', error);
});

client.login(process.env.DISCORD_TOKEN).catch(e => {
  console.error('Giriş başarısız:', e);
});
