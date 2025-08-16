const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('basvuru')
    .setDescription('TKA başvuru formunu gönderir'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📝 TKA Başvuru Formu')
      .setDescription(
        '**• Roblox İsminiz:**\n\n' +
        '**• Discord İsminiz:**\n\n' +
        '**• Hangi kamplardan geliyorsunuz? [Hepsini yazınız]**\n\n' +
        '**• Geldiğiniz kampların grup üye sayıları: [Hepsini yazınız]**\n\n' +
        '**• Daha önce TKA ordusunda bulundunuz mu?**\n\n' +
        '**• Kampların Roblox grubunda yer alıyor musunuz?**\n\n' +
        '**• SS / Kanıt:**\nHer kamp için **iki farklı oyun içi SS** gereklidir.\n' +
        '→ SS\'lerin **farklı günlerde** olması şarttır.\n' +
        '→ Bu kural, kampta uzun süre bulunduğunuzu kanıtlamak içindir.'
      )
      .setFooter({ text: 'TKA Başvuru Sistemi' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false }); // herkes görsün diye false
  },
};
