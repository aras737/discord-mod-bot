const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Bilet sistemi için mesaj gönderir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('🎫 Bilet Oluştur')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: '✅ Bilet sistemi kuruldu.', ephemeral: true });
    await interaction.channel.send({
      content: '🎟️ Destek için aşağıdaki butona bas!',
      components: [row],
    });
  },
};
