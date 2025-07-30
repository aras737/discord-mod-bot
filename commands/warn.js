const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyar')
    .setDescription('Bir kullanıcıyı uyarır.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Uyarılacak kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Uyarı sebebi')
        .setRequired(true)
    ),

  async execute(interaction) {
    const hedef = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep');
    const moderator = interaction.user.tag;

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Uyarı Aldınız')
      .addFields(
        { name: 'Sebep', value: sebep },
        { name: 'Uyaran Yetkili', value: moderator },
        { name: 'Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
      )
      .setColor('Red');

    try {
      await hedef.send({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ content: '❌ Bu kişiye DM gönderilemedi.', ephemeral: true });
    }

    await interaction.reply({ content: `✅ ${hedef.tag} uyarıldı ve DM gönderildi.`, ephemeral: true });
  }
};
