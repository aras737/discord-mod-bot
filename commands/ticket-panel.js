// commands/ticket-panel.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Bilet paneli gönderir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket_menu')
        .setLabel('🎫 Bilet Oluştur')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: 'Destek almak için aşağıdaki butona tıklayın.',
      components: [row],
    });
  },
};
