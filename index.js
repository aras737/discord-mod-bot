const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// Environment değişkeninden token alınır
client.login(process.env.TOKEN).catch((err) => {
  console.error('❌ Bot giriş hatası:', err);
});
