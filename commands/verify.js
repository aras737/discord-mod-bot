const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox grup üyeliğini doğrular.')
    .addStringOption(option => 
      option.setName('username')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)),
  
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const groupId = parseInt(process.env.ROBLOX_GROUP_ID, 10);
    const roleId = process.env.VERIFY_ROLE_ID;

    try {
      // Kullanıcı ID al
      const userRes = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
      if (!userRes.data || userRes.data.Id === 0) {
        return interaction.reply({ content: 'Geçersiz Roblox kullanıcı adı.', ephemeral: true });
      }
      const userId = userRes.data.Id;

      // Grup üyeliği kontrol
      const groupRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      const groups = groupRes.data.data;
      const isMember = groups.some(g => g.group.id === groupId);

      if (!isMember) {
        return interaction.reply({ content: 'Bu kullanıcı belirtilen Roblox grubuna üye değil.', ephemeral: true });
      }

      // Rol verme
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(roleId);

      return interaction.reply({ content: 'Başarıyla doğrulandınız ve rolünüz verildi.', ephemeral: true });

    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'Bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
    }
  }
};
