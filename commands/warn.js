const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyar')
    .setDescription('Bir kullanıcıya uyarı gönderir.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Uyarılacak kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Uyarı sebebi')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers), // Yetkililere izin veriyoruz
  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep');
    const author = interaction.user;

    if (target.bot) {
      return interaction.reply({ content: 'Botlara uyarı gönderemezsin.', ephemeral: true });
    }

    const timestamp = new Date().toLocaleString('tr-TR');

    const dmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Uyarı Bildirimi')
      .setDescription(`Bir yetkili tarafından uyarıldınız.`)
      .addFields(
        { name: '📅 Tarih', value: timestamp, inline: true },
        { name: '👮 Yetkili', value: `${author.tag}`, inline: true },
        { name: '📝 Sebep', value: reason }
      )
      .setColor(0xffa500);

    try {
      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      return interaction.reply({ content: 'Kullanıcının DM kutusu kapalı. Uyarı gönderilemedi.', ephemeral: true });
    }

    await interaction.reply({ content: `✅ ${target.tag} adlı kullanıcı başarıyla uyarıldı.` });
  }
};
