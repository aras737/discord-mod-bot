const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const GROUP_ID = process.env.GROUP_ID;
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const DATA_FILE = './verified.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifykontrol')
    .setDescription('Roblox doğrulama kodunu kontrol et'),

  async execute(interaction) {
    const userId = interaction.user.id;
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!data[userId] || !data[userId].code || !data[userId].robloxUsername) {
      return interaction.reply({ content: "❌ Önce /verify komutunu kullanmalısınız.", ephemeral: true });
    }

    const { robloxUsername, code } = data[userId];

    try {
      const resUser = await axios.post(`https://users.roblox.com/v1/usernames/users`, {
        usernames: [robloxUsername]
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!resUser.data.data.length) {
        return interaction.reply({ content: "❌ Roblox kullanıcı adı bulunamadı.", ephemeral: true });
      }

      const robloxId = resUser.data.data[0].id;

      const resDesc = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
      if (!resDesc.data.description.includes(code)) {
        return interaction.reply({ content: "❌ Doğrulama kodu açıklamada bulunamadı.", ephemeral: true });
      }

      const resGroup = await axios.get(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
      const groupRole = resGroup.data.data.find(g => g.group.id == parseInt(GROUP_ID));
      if (!groupRole) {
        return interaction.reply({ content: "❌ Roblox grubunda rolünüz bulunamadı.", ephemeral: true });
      }

      const discordRole = interaction.guild.roles.cache.find(r => r.name === groupRole.role.name);
      if (discordRole) await interaction.member.roles.add(discordRole);

      await interaction.member.roles.add(VERIFIED_ROLE_ID);

      data[userId] = { robloxId, verified: true, verifiedAt: Date.now() };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

      if (LOG_CHANNEL_ID) {
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
          logChannel.send(`✅ ${interaction.user.tag} doğrulandı. Rol: **${groupRole.role.name}**`);
        }
      }

      await interaction.reply({ content: `✅ Doğrulama başarılı! Rol: **${groupRole.role.name}**`, ephemeral: true });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: "⚠️ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.", ephemeral: true });
    }
  }
};
