require('dotenv').config();
const { Client, Intents } = require('discord.js');

// Botu oluştur
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

// Bot hazır olduğunda mesaj ver
client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// Basit ping komutu
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    await message.reply('🏓 Pong!');
  }
});

// Token ile giriş
client.login(process.env.TOKEN);
