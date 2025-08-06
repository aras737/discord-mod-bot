const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('🎫 Ticket panelini gönderir'),
  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_menu')
      .setPlaceholder('🎫 Destek Kategorisi Seçin')
      .addOptions([
        {
          label: 'Genel Destek',
          value: 'genel',
          description: 'Genel konularda yardım alın',
        },
        {
          label: 'Yetkili Başvuru',
          value: 'basvuru',
          description: 'Yetkili olmak için başvuru aç',
        },
        {
          label: 'Ortaklık',
          value: 'ortaklik',
          description: 'Ortaklık için ticket aç',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.reply({
      content: '🎫 Aşağıdan bir kategori seçerek destek talebi oluşturabilirsiniz:',
      components: [row],
    });
  },
};
