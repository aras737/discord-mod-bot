const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabınızı doğrular.')
    .addStringOption(option =>
      option.setName('kullanici')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanici');
    const groupId = '33389098';
    const verifiedRoleId = '1399254986348560526';

    await interaction.deferReply({ ephemeral: true });

    try {
      // ✅ Yeni API ile kullanıcı ID al
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: true
      });

      const userData = userRes.data.data[0];
      if (!userData || !userData.id) {
        return interaction.editReply({ content: '❌ Kullanıcı bulunamadı.' });
      }

      const userId = userData.id;

      // ✅ Grup üyeliği kontrolü
      const groupRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      const isMember = groupRes.data.data.some(g => g.group.id == groupId);

      if (!isMember) {
        return interaction.editReply({ content: '❌ Bu kullanıcı grupta değil.' });
      }

      // ✅ Discord rol ver
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(verifiedRoleId);

      return interaction.editReply({ content: `✅ ${username} başarıyla doğrulandı.` });

    } catch (error) {
      console.error('🔴 Doğrulama hatası:', error.response?.data || error.message || error);
      return interaction.editReply({ content: '❌ Doğrulama sırasında bir hata oluştu. Loglara bak.' });
    }
  }
};
