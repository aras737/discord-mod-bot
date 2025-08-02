const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('doğrula')
    .setDescription('Roblox hesabınızı doğrulayın.')
    .addStringOption(option =>
      option.setName('kullanıcı')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanıcı');

    await interaction.deferReply(); // bot yanıt veriyor gösterimi

    try {
      // 1. Kullanıcı adıyla ID çek
      const userResponse = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          usernames: [username],
          excludeBannedUsers: true
        },
        method: 'POST'
      });

      const userData = userResponse.data.data[0];

      if (!userData) {
        return interaction.editReply({ content: `❌ Kullanıcı bulunamadı: **${username}**`, ephemeral: true });
      }

      const userId = userData.id;

      // 2. Grup bilgilerini al
      const groupsRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups`);
      const groups = groupsRes.data.data;

      const embed = new EmbedBuilder()
        .setTitle('✅ Roblox Doğrulama')
        .setDescription(`Kullanıcı: **${userData.name}**\nID: **${userId}**`)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
        .setColor(0x00AE86);

      if (groups.length > 0) {
        const groupList = groups
          .map(g => `• **${g.group.name}** (Rol: ${g.role})`)
          .slice(0, 5) // ilk 5 grup
          .join('\n');
        embed.addFields({ name: 'Grup Üyelikleri', value: groupList });
      } else {
        embed.addFields({ name: 'Grup Üyeliği', value: 'Yok' });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ Doğrulama sırasında hata oluştu.', ephemeral: true });
    }
  }
};
