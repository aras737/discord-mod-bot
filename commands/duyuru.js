const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Everyone etiketli duyuru gönderir.')
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Duyuru mesajını yaz.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const mesaj = interaction.options.getString('mesaj');

    const embed = new EmbedBuilder()
      .setTitle('📢 Yeni Duyuru!')
      .setDescription(`@everyone\n\n${mesaj}`)
      .setColor('Yellow')
      .setTimestamp()
      .setFooter({ text: `Gönderen: ${interaction.user.tag}` });

    const buton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('onayla')
        .setLabel('✅ Gördüm')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ content: '@everyone', embeds: [embed], components: [buton] });
  },
};
