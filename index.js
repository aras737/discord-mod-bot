require('dotenv').config();
const { Client, Intents } = require('discord.js');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

client.once('ready', () => {
  console.log(`✅ Phantom bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    await message.reply('🏓 Pong!');
  }
});

client.login(process.env.TOKEN).catch(() => {
  console.log('❌ Bot tokeni geçersiz veya eksik!');
});
