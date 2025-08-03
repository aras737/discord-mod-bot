// commands/doğrula.js
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const ROBLOX_GROUP_ID = '1234567'; // <- Roblox grubunun ID'si
const DISCORD_ROLE_ID = '987654321098765432'; // <- Doğrulanınca verilecek rol

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
      // 1. Roblox ID al
      const userRes = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
        data: { usernames: [username] },
        headers: { 'Content-Type': 'application/json' }
      });

      if (!userRes.data || !userRes.data.data || userRes.data.data.length === 0) {
        return interaction.editReply('❌ Roblox kullanıcısı bulunamadı!');
      }

      const robloxId = userRes.data.data[0].id;

      // 2. Grup üyeliği kontrol
      const groupRes = await axios.get(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`);
      const groups = groupRes.data.data;

      const isInGroup = groups.some(g => g.group.id.toString() === ROBLOX_GROUP_ID);

      if (!isInGroup) {
        return interaction.editReply('🚫 Bu kullanıcı belirttiğiniz grupta bulunmuyor. Sahte olabilir!');
      }

      // 3. Rol ver
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(DISCORD_ROLE_ID);

      return interaction.editReply(`✅ Doğrulama başarılı! Rol verildi, ${username}`);
    } catch (err) {
      console.error('Doğrulama hatası:', err);
      return interaction.editReply('❌ Bir hata oluştu, daha sonra tekrar deneyin.');
    }
  }
};
