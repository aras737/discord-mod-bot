const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Kullanıcının tüm rütbelerini ve rollerini listeler.')
    .addUserOption(option => option.setName('kullanici').setDescription('Rütbeleri görülecek kullanıcı').setRequired(false)),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanici') || interaction.member;

    if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

    // Tüm rolleri isimleriyle alalım (everyone hariç)
    const roles = member.roles.cache.filter(r => r.name !== '@everyone');

    // Rütbe tanımları (rol isimlerine göre)
    const rankMap = [
      { name: 'Yönetici', check: (m) => m.permissions.has('Administrator') },
      { name: 'Moderatör', check: (m) => m.permissions.has('BanMembers') || m.permissions.has('KickMembers') },
      { name: 'Özel Üye', check: (m) => roles.some(r => r.name.toLowerCase() === 'özel üye') },
      { name: 'Üye', check: () => true }, // En son default
    ];

    // Kullanıcının sahip olduğu ilk eşleşen rütbeyi bulalım
    const userRank = rankMap.find(r => r.check(member)).name;

    // Rolleri sıralı olarak isim listesi yapalım
    const roleNames = roles.map(r => r.name).join(', ') || 'Rolü yok';

    await interaction.reply({
      content: `${member} kullanıcısının rolleri: **${roleNames}**\nRütbesi: **${userRank}**`
    });
  },
};
