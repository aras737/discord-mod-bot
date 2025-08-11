const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Bilet oluşturma panelini gönderir.'),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket-olustur')
        .setLabel('🎫 Bilet Oluştur')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: '📩 Destek talebi oluşturmak için aşağıdaki butona tıklayın:',
      components: [row]
    });
  }
};
