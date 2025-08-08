const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox grubundaki rolüne göre Discord rolü alırsın.')
    .addStringOption(option =>
      option.setName('kullaniciadi')
        .setDescription('Roblox kullanıcı adını gir')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullaniciadi');
    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. Kullanıcıyı Roblox'ta bul
      const userRes = await fetch(`https://users.roblox.com/v1/usernames/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
      });

      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) {
        return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');
      }

      const robloxId = userData.data[0].id;

      // 2. Gruba ait rol bilgisi al
      const groupRes = await fetch(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`);
      const groupData = await groupRes.json();

      const userGroup = groupData.data.find(group => group.group.id == process.env.GROUP_ID);

      if (!userGroup) {
        return interaction.editReply('❌ Belirtilen gruba üye değilsin.');
      }

      const robloxRoleName = userGroup.role.name;
      const member = await interaction.guild.members.fetch(interaction.user.id);

      // 3. Discord'da aynı isimli rol var mı kontrol et
      const discordRole = interaction.guild.roles.cache.find(role =>
        role.name.toLowerCase() === robloxRoleName.toLowerCase()
      );

      if (!discordRole) {
        return interaction.editReply(`❌ Roblox rolün: "${robloxRoleName}", ama Discord’da bu isimde bir rol yok.`);
      }

      // 4. Rolü ver
      await member.roles.add(discordRole);
      await interaction.editReply(`✅ Roblox rolün "${robloxRoleName}" Discord’da başarıyla verildi!`);
    } catch (err) {
      console.error('❌ Doğrulama hatası:', err);
      await interaction.editReply('❌ Bir hata oluştu, lütfen tekrar dene.');
    }
  }
};
