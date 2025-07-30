const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet')
    .setDescription('Bilet sistemi başlatır (Buton ile).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Destek Talebi')
      .setDescription('Destek almak için aşağıdaki butona basın.')
      .setColor(0x00ffcc);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('bilet_ac')
        .setLabel('📩 Bilet Aç')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
