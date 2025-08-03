const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID;
const DISCORD_ROLE_ID = process.env.DISCORD_ROLE_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('doğrula')
    .setDescription('Roblox gruba göre doğrulama yapar.')
    .addStringOption(opt =>
      opt.setName('kullanici')
        .setDescription('Roblox kullanıcı adınızı girin.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanici');
    await interaction.deferReply({ ephemeral: true });

    try {
      // Roblox kullanıcı ID'si al
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: true
      });

      if (!userRes.data?.data?.[0]?.id) {
        return interaction.editReply('❌ Roblox kullanıcısı bulunamadı!');
      }

      const robloxId = userRes.data.data[0].id;

      // Grup kontrol
      const groupRes = await axios.get(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`);
      const groups = groupRes.data.data;

      const isInGroup = groups.some(g => g.group.id.toString() === ROBLOX_GROUP_ID);

      if (!isInGroup) {
        return interaction.editReply('🚫 Bu kullanıcı grupta değil. Sahte olabilir!');
      }

      // Rol ver
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(DISCORD_ROLE_ID);

      return interaction.editReply(`✅ ${username} doğrulandı. Rol verildi.`);
    } catch (err) {
      console.error('Doğrulama hatası:', err);
      return interaction.editReply('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }
};
