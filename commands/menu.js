const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Bilet sistemi panelini kurar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Destek Talebi Oluştur')
      .setDescription('Herhangi bir sorununuz varsa aşağıdaki butona tıklayarak destek bileti oluşturabilirsiniz.\n\n📌 Lütfen sadece gerçekten yardıma ihtiyacınız varsa bilet oluşturun.\n\n⛔ Kurallara uymayan kullanıcıların bileti kapatılacaktır.')
      .setColor('#2b2d31');

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('bilet-olustur')
        .setLabel('📩 Bilet Oluştur')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [button] });
  },
};
