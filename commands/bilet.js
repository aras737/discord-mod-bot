const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet')
    .setDescription('Destek bileti açmak için buton gösterir.'),
  async execute(interaction) {
    const button = new ButtonBuilder()
      .setCustomId('ticket-olustur')
      .setLabel('🎫 Destek Bileti Aç')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ content: 'Bilet açmak için butona tıkla!', components: [row], ephemeral: true });
  },
};
