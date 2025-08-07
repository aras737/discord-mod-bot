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
      }
    }
  }
};
