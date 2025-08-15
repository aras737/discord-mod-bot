// verify.js
const fs = require('fs');
const axios = require('axios');
const path = './verified.json';
const config = require('../config'); // Grup ID ve verified rol ID burada

module.exports = {
  name: 'verify',
  description: 'Roblox hesabınızı doğrular',
  async execute(interaction) {
    const userId = interaction.user.id;

    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));

    let verifiedData = JSON.parse(fs.readFileSync(path));

    if (verifiedData[userId]) {
      return interaction.reply({ content: '✅ Zaten doğrulandın!', ephemeral: true });
    }

    const code = `DISCORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await interaction.reply({
      content: `🔍 **Doğrulama Talimatı**\n1️⃣ Roblox profil açıklamana şu kodu ekle:\n\`\`\`${code}\`\`\`\n2️⃣ 2 dakika içinde tekrar \`/verify\` yaz.`,
      ephemeral: true
    });

    const timeout = Date.now() + 120000;

    const interval = setInterval(async () => {
      if (Date.now() > timeout) {
        clearInterval(interval);
        return;
      }

      try {
        // Roblox kullanıcı adını Discord displayName üzerinden alıyoruz
        const username = interaction.member.displayName;

        const res = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
        if (!res.data.Id) return;

        const robloxId = res.data.Id;

        const descRes = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
        if (descRes.data.description && descRes.data.description.includes(code)) {
          clearInterval(interval);

          verifiedData[userId] = {
            robloxId,
            robloxName: username,
            verifiedAt: new Date().toISOString()
          };
          fs.writeFileSync(path, JSON.stringify(verifiedData, null, 2));

          // Sabit verified rolü
          await interaction.member.roles.add(config.roles.verified).catch(() => {});

          // Roblox grubundaki rolüne göre Discord rolü ver (isim eşleşmesi)
          const groupRes = await axios.get(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
          const groupData = groupRes.data.data.find(g => g.group.id == config.roblox.groupId);

          if (groupData) {
            const robloxRoleName = groupData.role.name;
            const discordRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === robloxRoleName.toLowerCase());
            if (discordRole) {
              await interaction.member.roles.add(discordRole).catch(() => {});
            }
          }

          // Log kanalı
          if (config.channels.verifyLog) {
            const logChannel = interaction.guild.channels.cache.get(config.channels.verifyLog);
            if (logChannel) {
              logChannel.send(`✅ **${interaction.user.tag}** Roblox hesabı **${username}** ile doğrulandı.`);
            }
          }

          return interaction.followUp({ content: '✅ Doğrulama başarılı!', ephemeral: true });
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
  }
};
