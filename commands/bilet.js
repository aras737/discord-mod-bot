const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet')
    .setDescription('Destek bilet sistemi başlatır.'),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('🎫 Destek kategorisi seçiniz...')
        .addOptions([
          {
            label: 'Genel Destek',
            description: 'Her türlü soru için.',
            value: 'genel_destek',
            emoji: '💬',
          },
          {
            label: 'Satın Alma',
            description: 'Satın alma hakkında yardım.',
            value: 'satin_alma',
            emoji: '💰',
          },
          {
            label: 'Şikayet',
            description: 'Birini şikayet etmek istiyorum.',
            value: 'sikayet',
            emoji: '⚠️',
          },
        ])
    );

    await interaction.reply({
      content: '🎫 Lütfen bir destek türü seçin:',
      components: [row],
      ephemeral: true
    });
  },
};
