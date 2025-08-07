const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('🎫 Ticket butonunu gönderir'),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_olustur')
        .setLabel('🎫 Ticket Oluştur')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: 'Aşağıdaki butona tıklayarak destek talebi oluşturabilirsin:',
      components: [row]
    });
  },
};
