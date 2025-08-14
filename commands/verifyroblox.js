const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabını doğrula (2 dakika geçerli kod)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const kodlar = JSON.parse(fs.readFileSync('./kodlar.json', 'utf8'));

    if (kodlar[userId]) {
      return interaction.reply({ content: '⚠️ Zaten bir doğrulama kodun var. `/verify-kontrol` komutunu kullan.', ephemeral: true });
    }

    const kod = Math.random().toString(36).substring(2, 8).toUpperCase();
    kodlar[userId] = { kod, bitis: Date.now() + 120000 }; // 2 dakika geçerli
    fs.writeFileSync('./kodlar.json', JSON.stringify(kodlar, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('Roblox Doğrulama')
      .setDescription(`Aşağıdaki kodu Roblox profil açıklamana ekle:\n\n\`${kod}\`\n\nKod **2 dakika** geçerli.\nEkledikten sonra **/verify-kontrol** yaz.`)
      .setColor('Blue');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Roblox Profilime Git')
          .setStyle(ButtonStyle.Link)
          .setURL('https://www.roblox.com/my/profile')
      );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
