const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetkiler')
    .setDescription('Sunucudaki roller ve senin yetkin nedir, gösterir.'),
  
  async execute(interaction) {
    const member = interaction.member;
    const roles = member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.name);
    
    let seviye = 'Üye';
    if (member.permissions.has('Administrator')) seviye = '👑 Yönetici';
    else if (member.permissions.has('KickMembers')) seviye = '🛡️ Moderatör';
    else if (member.permissions.has('ManageMessages')) seviye = '🔧 Yardımcı';

    const embed = new EmbedBuilder()
      .setTitle('🔎 Yetki Bilgisi')
      .setDescription(`Senin rütben: **${seviye}**`)
      .addFields({ name: 'Rollerin', value: roles.join(', ') || 'Yok' })
      .setColor(0x00bfff)
      .setFooter({ text: `Kullanıcı: ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
