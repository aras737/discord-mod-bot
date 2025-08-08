const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const verifiedFile = path.join(__dirname, '../verified.json');
let verifiedUsers = {};

if (fs.existsSync(verifiedFile)) {
  verifiedUsers = JSON.parse(fs.readFileSync(verifiedFile, 'utf-8'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabınızı doğrulamanızı sağlar'),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (verifiedUsers[userId]) {
      return interaction.reply({ content: '✅ Zaten doğrulanmışsın.', ephemeral: true });
    }

    const verifyCode = `discord-verify-${userId}`;

    await interaction.reply({
      content: `🔐 Doğrulama için lütfen Roblox profilinin açıklama kısmına şu kodu ekleyin:\n\n\`${verifyCode}\`\n\nKod eklendikten sonra bu komutu tekrar yazın.`,
      ephemeral: true
    });

    const filter = i => i.user.id === interaction.user.id;
    try {
      const confirmation = await interaction.channel.awaitMessages({ filter, max: 1, time: 300000, errors: ['time'] });
      const retry = confirmation.first();

      // ROBLOX kullanıcı adını al
      const username = retry.content;

      // ROBLOX ID al
      const userInfo = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
        method: 'POST',
        data: { usernames: [username] },
        headers: { 'Content-Type': 'application/json' }
      });

      const robloxId = userInfo.data.data[0]?.id;
      if (!robloxId) return interaction.followUp({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

      // PROFİL verisini al
      const profile = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
      const description = profile.data.description;

      if (!description.includes(verifyCode)) {
        return interaction.followUp({ content: '❌ Kod profil açıklamasında bulunamadı.', ephemeral: true });
      }

      // Kaydet
      verifiedUsers[userId] = {
        discordId: userId,
        robloxId,
        username
      };

      fs.writeFileSync(verifiedFile, JSON.stringify(verifiedUsers, null, 2));

      // ROLLERİ VER
      const member = await interaction.guild.members.fetch(userId);
      const verifyRole = interaction.guild.roles.cache.get(process.env.VERIFY_ROLE_ID);
      if (verifyRole) await member.roles.add(verifyRole);

      // Roblox grubundaki rolü kontrol et (isteğe bağlı)
      // Burada gruptan rol ID’si eşleştirmesi yapılabilir

      // LOG
      const logChannel = interaction.guild.channels.cache.get(process.env.VERIFY_LOG_CHANNEL);
      if (logChannel) {
        logChannel.send(`✅ ${interaction.user.tag} (${username}) başarıyla doğrulandı.`);
      }

      interaction.followUp({ content: '✅ Doğrulama tamamlandı!', ephemeral: true });

    } catch (err) {
      console.error(err);
      return interaction.followUp({ content: '❌ Doğrulama sırasında bir hata oluştu.', ephemeral: true });
    }
  }
};
