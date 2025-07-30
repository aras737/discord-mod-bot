const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Gömülü everyone duyurusu gönderir.')
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Duyuru mesajını girin')
        .setRequired(true)
    ),

  async execute(interaction) {
    const mesaj = interaction.options.getString('mesaj');

    const embed = new EmbedBuilder()
      .setTitle('📢 Yeni Duyuru')
      .setDescription(mesaj)
      .setColor('Yellow')
      .setTimestamp();

    const buton = new ButtonBuilder()
      .setCustomId('onayla')
      .setLabel('✅ Okudum')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(buton);

    await interaction.reply({ content: '@everyone', embeds: [embed], components: [row] });
  }
};
