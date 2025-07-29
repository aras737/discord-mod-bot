const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.TOKEN || "MTM5NDQyODEwMTM2NjI1NTY1Ng.G1dmYr.Gya5jXXTV2CbEWJ2nWMpMdeYkFT7g2A8IihEdI"; // Render'dan alır, yoksa kod içinden alır

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

client.on('error', (err) => {
  console.error('Bot hatası (yutuldu):', err.message);
});

client.login(TOKEN).catch(err => {
  console.error("❌ Token geçersiz veya bot başlatılamadı.");
  // Burada çıkış yapmıyoruz, uygulama açık kalıyor
});
