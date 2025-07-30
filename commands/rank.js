const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Sunucudaki rollerine göre rütbeni gösterir.')
    .addUserOption(option => option.setName('kullanici').setDescription('Rütbesi görülecek kullanıcı').setRequired(false)),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanici') || interaction.member;

    // Kullanıcının rolleri ve yetkilerini alıyoruz
    const roles = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'Rolü yok';

    // Örnek rütbe sistemi basit: Yetkili mi? Yönetici mi? Normal mi?
    let rank = 'Üye';
    if (member.permissions.has('Administrator')) rank = 'Yönetici';
    else if (member.permissions.has('BanMembers') || member.permissions.has('KickMembers')) rank = 'Yetkili';

    await interaction.reply({ content: `${member} kullanıcısının rolleri: **${roles}**\nRütbesi: **${rank}**` });
  },
};
