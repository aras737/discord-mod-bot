require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
  console.log(`✅ Bot aktif! Kullanıcı: ${client.user.tag}`);
});

client.on('message', message => {
  try {
    if (message.author.bot) return;
    if (message.content === '!ping') {
      message.channel.send('🏓 Pong!');
    }
  } catch (err) {
    // Hataları sessizce geç
  }
});

try {
  client.login(process.env.TOKEN);
} catch (e) {
  console.log('❌ Bot tokeni geçersiz veya .env dosyası eksik.');
}
