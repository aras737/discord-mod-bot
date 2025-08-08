const Discord = require('discord.js');

// Basit küfür listesi – istediğini artırabilirsin
const kufurler = ['amk', 'aq', 'orospu', 'sik', 'piç', 'anan', 'yarrak', 'mk'];

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Bot mesajıysa geç
    if (message.author.bot) return;

    // DM kontrolü
    if (!message.guild) return;

    // Küfür içeriyor mu kontrol et
    const içerik = message.content.toLowerCase();

    if (kufurler.some(kelime => içerik.includes(kelime))) {
      try {
        await message.delete(); // Mesajı sil
        await message.channel.send({
          content: `⚠️ ${message.author}, küfür etme!`,
          ephemeral: true
        });
      } catch (err) {
        console.error('Küfür mesajı silinemedi:', err);
     const afk = require('../commands/afk.js');

module.exports = {
  async execute(message) {
    if (message.author.bot) return;

    // Eğer mesaj atan AFK'ysa, kaldır
    if (afk.afkMap.has(message.author.id)) {
      afk.afkMap.delete(message.author.id);
      message.reply('✅ AFK modundan çıktınız.');
    }

    // Eğer etiketlenen biri AFK'ysa, sebebi göster
    message.mentions.users.forEach(user => {
      const reason = afk.afkMap.get(user.id);
      if (reason) {
        message.reply(`💤 ${user.username} şu anda AFK: ${reason}`);
      }
    });
  }
};
