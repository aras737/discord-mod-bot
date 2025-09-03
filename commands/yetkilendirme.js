const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetki')
    .setDescription('Sunucudaki tüm rolleri ve sahip oldukları temel yetkileri listeler.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Bu komutu sadece rol yönetme yetkisi olanlar kullanabilir

  async execute(interaction) {
    const roles = interaction.guild.roles.cache.sort((a, b) => b.position - a.position);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Sunucudaki Rollerin Yetki Bilgileri')
      .setDescription('Bu listede, her rolün temel yetkileri gösterilmektedir.')
      .setTimestamp()
      .setFooter({ text: `Komutu kullanan: ${interaction.user.tag}` });

    let descriptionText = '';

    roles.forEach(role => {
      // @everyone rolünü atlıyoruz
      if (role.name === '@everyone') return;

      const isAdmin = role.permissions.has(PermissionFlagsBits.Administrator);
      const canKickMembers = role.permissions.has(PermissionFlagsBits.KickMembers);
      const canBanMembers = role.permissions.has(PermissionFlagsBits.Flags.BanMembers);
      const canManageChannels = role.permissions.has(PermissionFlagsBits.Flags.ManageChannels);
      
      descriptionText += `**Rol:** ${role.name}\n`;
      descriptionText += `**Yönetici Yetkisi:** ${isAdmin ? '✅ Evet' : '❌ Hayır'}\n`;
      descriptionText += `**Üyeleri Atma Yetkisi:** ${canKickMembers ? '✅ Evet' : '❌ Hayır'}\n`;
      descriptionText += `**Üyeleri Yasaklama Yetkisi:** ${canBanMembers ? '✅ Evet' : '❌ Hayır'}\n`;
      descriptionText += `**Kanalları Yönetme Yetkisi:** ${canManageChannels ? '✅ Evet' : '❌ Hayır'}\n`;
      descriptionText += "--------------------------------------\n";
    });

    // Mesajın karakter limitini kontrol ediyoruz
    if (descriptionText.length > 4096) {
      descriptionText = descriptionText.substring(0, 4093) + '...';
    }

    embed.setDescription(descriptionText);

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
