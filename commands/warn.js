const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyar')
    .setDescription('Bir kullanıcıya özel mesaj (DM) ile uyarı gönder.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Uyarılacak kişi')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Uyarı sebebi')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep');
    const yetkili = interaction.user;
    const timestamp = new Date().toLocaleString('tr-TR');

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Uyarı Bildirimi')
      .setDescription(`Bir yetkili tarafından uyarıldınız.`)
      .addFields(
        { name: '📅 Tarih', value: timestamp, inline: true },
        { name: '👮 Yetkili', value: `${yetkili.tag}`, inline: true },
        { name: '📝 Sebep', value: reason }
      )
      .setColor(0xffa500)
      .setFooter({ text: 'Lütfen kurallara dikkat edin.' });

    try {
      await target.send({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({ content: '❌ Kullanıcının DM kutusu kapalı. Uyarı gönderilemedi.', ephemeral: true });
    }

    await interaction.reply({ content: `✅ ${target.tag} adlı kullanıcı başarıyla uyarıldı.` });
  }
};
