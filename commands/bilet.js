const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet')
    .setDescription('Destek bileti açma panelini gönderir.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('🎫 Destek Sistemi')
      .setDescription('Herhangi bir sorun ya da yardım için aşağıdaki butona tıklayarak bir **bilet açabilirsiniz.**\n\n📌 Lütfen gereksiz yere bilet açmayın.')
      .setFooter({ text: 'Destek Ekibi' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open')
        .setLabel('📩 Bilet Aç')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
