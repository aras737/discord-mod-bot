// commands/dogrula.js
const axios = require('axios');

module.exports = {
  data: {
    name: 'doğrula',
    description: 'Roblox hesabınızı doğrulayın.',
    options: [
      {
        name: 'kullanıcıadı',
        type: 3,
        description: 'Roblox kullanıcı adınız',
        required: true
      }
    ]
  },

  async execute(interaction) {
    const username = interaction.options.getString('kullanıcıadı');

    try {
      // 1. Kullanıcı adını ID'ye çevir
      const res = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
        data: {
          usernames: [username],
          excludeBannedUsers: true
        }
      });

      const userData = res.data.data[0];
      if (!userData) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

      const robloxId = userData.id;
      const verifyCode = `DC-${interaction.user.id}`; // Discord ID tabanlı doğrulama kodu

      const desc = `
✅ Roblox hesabınızı doğrulamak için:
1. [Profil ayarlarınıza](https://www.roblox.com/users/${robloxId}/profile) gidin.
2. **Hakkımda (About Me)** kısmına bu kodu ekleyin:
\`\`\`${verifyCode}\`\`\`
3. Sonra tekrar bu komutu yazın: \`/doğrula ${username}\`
`;

      // Kullanıcıya açıklamayı gönder
      await interaction.reply({ content: desc, ephemeral: true });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
    }
  }
};
