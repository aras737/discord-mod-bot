const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-kontrol')
    .setDescription('Doğrulama kodunu kontrol eder'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const kodlar = JSON.parse(fs.readFileSync('./kodlar.json', 'utf8'));
    const verified = JSON.parse(fs.readFileSync('./verified.json', 'utf8'));

    if (verified[userId]) {
      return interaction.reply({ content: '✅ Zaten doğrulandın!', ephemeral: true });
    }

    const veri = kodlar[userId];
    if (!veri) {
      return interaction.reply({ content: '⚠️ Önce `/verify` komutunu kullan.', ephemeral: true });
    }

    if (Date.now() > veri.bitis) {
      delete kodlar[userId];
      fs.writeFileSync('./kodlar.json', JSON.stringify(kodlar, null, 2));
      return interaction.reply({ content: '⏳ Kodun süresi dolmuş. Tekrar `/verify` komutunu kullan.', ephemeral: true });
    }

    try {
      // Roblox kullanıcı adını Discord takma adına göre belirleyebilirsin
      const robloxUsername = interaction.user.username;

      const response = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
        params: { usernames: [robloxUsername] }
      });

      if (!response.data.data.length) {
        return interaction.reply({ content: '❌ Roblox kullanıcısı bulunamadı.', ephemeral: true });
      }

      const robloxId = response.data.data[0].id;
      const aboutRes = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);

      if (aboutRes.data.description && aboutRes.data.description.includes(veri.kod)) {
        verified[userId] = { robloxId, username: robloxUsername };
        fs.writeFileSync('./verified.json', JSON.stringify(verified, null, 2));

        delete kodlar[userId];
        fs.writeFileSync('./kodlar.json', JSON.stringify(kodlar, null, 2));

        await interaction.reply({ content: '✅ Roblox hesabın başarıyla doğrulandı!', ephemeral: true });

        // Burada doğrulama rolünü ver
        const role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
        if (role) {
          await interaction.member.roles.add(role).catch(() => {});
        }
      } else {
        await interaction.reply({ content: '❌ Kod Roblox profil açıklamana eklenmemiş.', ephemeral: true });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({ content: '❌ Doğrulama sırasında hata oluştu.', ephemeral: true });
    }
  }
};
