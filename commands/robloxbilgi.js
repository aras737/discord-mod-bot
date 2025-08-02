const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robloxbilgi')
    .setDescription('Roblox kullanıcı bilgilerini ve grup üyeliklerini gösterir.')
    .addStringOption(option =>
      option.setName('kullanici')
        .setDescription('Roblox kullanıcı adı')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanici');
    await interaction.deferReply();

    try {
      // Kullanıcı ID al
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
      });

      const userData = userRes.data.data[0];
      if (!userData) return await interaction.editReply('❌ Kullanıcı bulunamadı.');

      const userId = userData.id;

      // Kullanıcı detayları
      const userInfoRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
      const userInfo = userInfoRes.data;

      // Gruplar
      const groupRes = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groups = groupRes.data.data;

      // Embed oluştur
      const embed = new EmbedBuilder()
        .setTitle(`${username} - Roblox Bilgileri`)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
        .setColor('Blue')
        .addFields(
          { name: '👤 Kullanıcı Adı', value: userInfo.name, inline: true },
          { name: '🆔 Kullanıcı ID', value: userInfo.id.toString(), inline: true },
          { name: '📅 Oluşturulma Tarihi', value: new Date(userInfo.created).toLocaleDateString(), inline: true },
          { name: '🔗 Profil', value: `https://www.roblox.com/users/${userInfo.id}/profile`, inline: false },
        );

      // Grupları ekle
      if (groups.length > 0) {
        embed.addFields({ name: `👥 Üye Olduğu Gruplar (${groups.length})`, value: '\u200b' });

        for (const group of groups.slice(0, 10)) {
          embed.addFields({
            name: `🏷️ ${group.group.name} (ID: ${group.group.id})`,
            value: `🏅 Rütbe: **${group.role.name}**\n🔗 [Grup Linki](https://www.roblox.com/groups/${group.group.id})`,
            inline: false
          });
        }
      } else {
        embed.addFields({ name: '👥 Grup Bilgisi', value: 'Bu kullanıcı hiçbir gruba üye değil.', inline: false });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Hata:', error);
      await interaction.editReply('❌ Bilgiler alınırken bir hata oluştu. Kullanıcı adı doğru mu?');
    }
  }
};
