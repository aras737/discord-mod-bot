require('dotenv').config();
const { Client, Intents } = require('discord.js');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

client.once('ready', () => {
  console.log(`Bot aktif! Kullanıcı: ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

// Token'ı process.env'den alır, Render'da ENV variable olarak ekle!
client.login(process.env.TOKEN).catch(err => {
  console.error('Bot tokeni geçersiz veya bulunamadı.');
});
