const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Sunucuda yönetim panelini gösterir (butonlu).'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛠 Sunucu Yönetim Paneli')
      .setDescription('Aşağıdaki butonları kullanarak işlemler yapabilirsin:')
      .setColor('DarkButNotBlack');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('bilet_ac')
        .setLabel('🎟 Bilet Aç')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('duyuru_gonder')
        .setLabel('📢 Duyuru Gönder')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('sunucu_bilgi')
        .setLabel('ℹ️ Sunucu Bilgi')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
