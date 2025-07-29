const { Client, GatewayIntentBits } = require('discord.js');

// Discord bot tokenını buraya yaz (güvenli değil, sadece test için önerilir)
const TOKEN = 'MTM5NDQyODEwMTM2NjI1NTY1Ng.G6HN3y.2QoUKNE4IEzoMQYWzkxvmtzLg1D0GsWf8OZisc';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot aktif! Giriş yaptı: ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

client.login(TOKEN).catch((err) => {
  console.error('Bot giriş yapamadı:', err);
});
