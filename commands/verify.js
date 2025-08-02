const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('doğrula')
    .setDescription('Roblox hesabınızı doğrulayın ve grubunuza göre rol alın.')
    .addStringOption(option =>
      option.setName('kullanıcı')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanıcı');
    const hedefGrupID = process.env.GRUP_ID; // Render üzerinden ayarlanacak
    const verilecekRolID = process.env.ROL_ID; // Render üzerinden ayarlanacak

    await interaction.deferReply();

    try {
      // 1. Kullanıcı adıyla ID çek
      const userResponse = await axios.post(`https://users.roblox.com/v1/usernames/users`, {
        usernames: [username],
        excludeBannedUsers: true
      });

      const userData = userResponse.data.data[0];
      if (!userData) {
        return interaction.editReply(`❌ Kullanıcı bulunamadı: **${username}**`);
      }

      const userId = userData.id;

      // 2. Grup kontrolü
      const groupsRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups`);
      const groups = groupsRes.data.data;

      const hedefGrup = groups.find(g => g.group.id.toString() === hedefGrupID);

      const embed = new EmbedBuilder()
        .setTitle('Roblox Doğrulama')
        .setDescription(`Roblox kullanıcısı: **${userData.name}**`)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
        .setColor(hedefGrup ? 0x00ff00 : 0xff0000);

      if (hedefGrup) {
        // ✅ Rol ver
        const role = interaction.guild.roles.cache.get(verilecekRolID);
        if (role) {
          await interaction.member.roles.add(role);
          embed.addFields({ name: 'Grup Üyeliği', value: `✅ **${hedefGrup.group.name}** (${hedefGrup.role})` });
          embed.setFooter({ text: 'Rol başarıyla verildi!' });
        } else {
          embed.addFields({ name: 'Hata', value: 'Rol bulunamadı.' });
        }
      } else {
        embed.addFields({ name: 'Grup Üyeliği', value: '❌ Belirtilen grupta değil.' });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Doğrulama sırasında hata oluştu.');
    }
  }
};
