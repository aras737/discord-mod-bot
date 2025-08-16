const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('basvuru')
    .setDescription('AAT başvuru formunu gönderir'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📝 TKA Başvuru Formu')
      .setDescription(
        '**• Roblox İsminiz:**\n\n' +
        '**• Discord İsminiz:**\n\n' +
        '**• Hangi kamplardan geliyorsunuz: [HEPSİNİ SAY]**\n\n' +
        '**• Geldiğiniz kampların grup üyesi sayıları: [HEPSİNİ SAY]**\n\n' +
        '**• Daha önce TKA ordusunda bulundunuz mu:**\n\n' +
        '**• Kampların Roblox grubunda yer alıyor musunuz:**\n\n' +
        '**• SS/Kanıt:** [Her kamp için iki tane oyun içi SS gerekmektedir. Bu, sizin kamptan hemen girip hemen çıkmadığınızı anlamamız için getirilen bir kuraldır. İki SS\'in de farklı günlerde olması gerekmektedir.]'
      )
      .setFooter({ text: 'TKA Başvuru Sistemi' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
