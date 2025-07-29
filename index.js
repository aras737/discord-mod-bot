require('dotenv').config();
const { Client, Intents } = require('discord.js');

// Yeni bir Discord client oluştur
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

// Bot hazır olduğunda çalışır
client.once('ready', () => {
  console.log(`${client.user.tag} olarak giriş yapıldı.`);
});

// Mesaj geldiğinde cevap verir (örnek komut)
client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

// .env dosyasındaki token ile giriş yap
client.login(process.env.TOKEN);
