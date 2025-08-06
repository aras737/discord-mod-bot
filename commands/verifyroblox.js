const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifyroblox')
    .setDescription('Roblox grubunda üye olup olmadığını doğrular.')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const groupId = process.env.ROBLOX_GROUP_ID; // Render ortam değişkeni

    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. Roblox kullanıcı ID'sini al
      const userRes = await axios.get(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`);
      if (!userRes.data || userRes.data.Id === 0) {
        return interaction.editReply({ content: 'Geçersiz Roblox kullanıcı adı girdiniz.' });
      }
      const userId = userRes.data.Id;

      // 2. Kullanıcının gruptaki durumu
      const groupRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      if (!groupRes.data || !groupRes.data.data) {
        return interaction.editReply({ content: 'Kullanıcı grubun bir üyesi değil.' });
      }

      const isMember = groupRes.data.data.some(g => g.group.id == groupId && g.role.rank > 0);

      if (isMember) {
        // Üye ise rol verebilir veya onay mesajı atabiliriz.
        // Örneğin, rol verme:
        const roleId = process.env.VERIFIED_ROLE_ID; // Doğrulama rolü ID'si (Render env)
        if (roleId) {
          const member = await interaction.guild.members.fetch(interaction.user.id);
          await member.roles.add(roleId);
        }

        return interaction.editReply({ content: `Tebrikler, ${username} kullanıcısı Roblox grubunda bulundu! Doğrulamanız başarılı.` });
      } else {
        return interaction.editReply({ content: 'Üzgünüz, belirtilen kullanıcı Roblox grubunun bir üyesi değil.' });
      }

    } catch (error) {
      console.error('Roblox doğrulama hatası:', error);
      return interaction.editReply({ content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyiniz.' });
    }
  }
};
