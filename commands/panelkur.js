const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panelkur')
    .setDescription('Destek bileti panelini kurar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('destek_menu')
        .setPlaceholder('Bir destek kategorisi seçiniz')
        .addOptions([
          { label: 'Genel Destek', value: 'genel', emoji: '🛠️' },
          { label: 'Satın Alma', value: 'satin_alma', emoji: '💰' },
          { label: 'Şikayet', value: 'sikayet', emoji: '📢' },
        ])
    );

    await interaction.reply({
      content: '🎫 Aşağıdan bir destek kategorisi seçerek destek bileti oluşturabilirsiniz.',
      components: [row],
    });
  },
};
