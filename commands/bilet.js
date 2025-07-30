const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Bilet menüsünü gönderir (Destek, Şikayet, Başvuru).'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Bilet Sistemi')
      .setDescription('Aşağıdan bir kategori seçerek bilet oluşturabilirsiniz:')
      .setColor('Blue');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_menu')
      .setPlaceholder('Bilet kategorisi seçin')
      .addOptions(
        {
          label: '📩 Destek',
          description: 'Genel destek talebi',
          value: 'destek',
        },
        {
          label: '🚫 Şikayet',
          description: 'Kullanıcı veya sistem şikayeti',
          value: 'sikayet',
        },
        {
          label: '📄 Başvuru',
          description: 'Yetkili/diğer başvurular',
          value: 'basvuru',
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
