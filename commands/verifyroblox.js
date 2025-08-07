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
    const groupId = '33389098'; // ✅ BURAYA GRUP ID'n GELSİN
    const verifiedRoleId = '1399254986348560526'; // ✅ BURAYA ROL ID GELSİN

    await interaction.deferReply({ ephemeral: true });

    try {
      // 1️⃣ Kullanıcı ID al
      const userRes = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
      const userId = userRes.data.Id;
      if (!userId) {
        return interaction.editReply({ content: '❌ Roblox kullanıcı adı geçersiz.' });
      }

      // 2️⃣ Gruba üye mi?
      const groupRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      const isMember = groupRes.data.data.some(g => g.group.id == groupId);

      if (!isMember) {
        return interaction.editReply({ content: '❌ Bu kullanıcı belirtilen grupta değil.' });
      }

      // 3️⃣ Rolü ver
      const role = interaction.guild.roles.cache.get(verifiedRoleId);
      if (!role) return interaction.editReply({ content: '❌ Doğrulama rolü bulunamadı.' });

      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(role);

      return interaction.editReply({ content: `✅ ${username} doğrulandı! Rol verildi.` });

    } catch (error) {
      console.error('🔴 Doğrulama hatası:', error.response?.data || error.message || error);
      return interaction.editReply({ content: '❌ Doğrulama sırasında beklenmedik bir hata oluştu. Loglara bak.' });
    }
  }
};
