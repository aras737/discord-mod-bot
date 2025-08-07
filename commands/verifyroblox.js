const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabınızı doğrulayın.')
    .addStringOption(option =>
      option.setName('kullanici')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanici');
    const groupId = '33389098'; // 🛠️ DEĞİŞTİR: Roblox grup ID
    const verifiedRoleId = '1394407533799805028'; // 🛠️ DEĞİŞTİR: Verilecek Discord rolü ID

    await interaction.deferReply({ ephemeral: true });

    try {
      // Roblox kullanıcı ID'sini al
      const userRes = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
      const userId = userRes.data.Id;
      if (!userId) return interaction.editReply({ content: '❌ Kullanıcı bulunamadı.' });

      // Grup üyeliğini kontrol et
      const groupRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      const isMember = groupRes.data.data.some(group => group.group.id == groupId);

      if (!isMember) {
        return interaction.editReply({ content: '❌ Belirtilen grupta değilsiniz.' });
      }

      // Rolü ver
      const role = interaction.guild.roles.cache.get(verifiedRoleId);
      if (!role) return interaction.editReply({ content: '❌ Rol bulunamadı. Lütfen yöneticinize bildirin.' });

      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(role);

      return interaction.editReply({ content: `✅ Doğrulama başarılı! ${role} rolü verildi.` });

    } catch (error) {
      console.error('Doğrulama hatası:', error);
      return interaction.editReply({ content: '❌ Doğrulama sırasında bir hata oluştu.' });
    }
  }
};
