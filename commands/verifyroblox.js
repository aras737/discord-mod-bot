const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const verifiedPath = path.join(__dirname, '../data/verified.json');
const config = require('../config.json');

function loadVerified() {
  if (!fs.existsSync(verifiedPath)) fs.writeFileSync(verifiedPath, '{}');
  return JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
}

function saveVerified(data) {
  fs.writeFileSync(verifiedPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabınızı doğrulayın'),

  async execute(interaction) {
    const verified = loadVerified();
    const userId = interaction.user.id;

    // 1. Zaten doğrulanmış mı?
    if (verified[userId]) {
      return interaction.reply({ content: '✅ Zaten doğrulandınız.', ephemeral: true });
    }

    // 2. Sadece belirli kanalda kullanılabilir
    if (interaction.channel.id !== config.channelId) {
      return interaction.reply({ content: '❌ Bu komutu sadece doğrulama kanalında kullanabilirsiniz.', ephemeral: true });
    }

    // 3. Kod oluştur
    const uniqueCode = `verify-${userId}-${Math.floor(100000 + Math.random() * 900000)}`;

    await interaction.reply({
      content: `👋 Roblox profilinizin **bio** kısmına bu kodu ekleyin:\n\n\`${uniqueCode}\`\n\nSonra **/verify** komutunu tekrar yazın.`,
      ephemeral: true
    });

    // 4. Kod kontrolü
    const filter = i => i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({ time: 120000 });

    // 5. Bekleme (timeout yerine kullanıcı tekrar yazmalı)
    const checkInterval = setInterval(async () => {
      try {
        // Kullanıcının Roblox username'ini al
        const res = await axios.get(`https://users.roblox.com/v1/users/authenticated`);
        const robloxUsername = res.data.name;

        // Username'den userId çek
        const userSearch = await axios.get(`https://api.roblox.com/users/get-by-username?username=${robloxUsername}`);
        const robloxId = userSearch.data.Id;

        if (!robloxId) return;

        // Bio kontrol
        const descRes = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
        const bio = descRes.data.description || '';
        if (!bio.includes(uniqueCode)) return;

        // Grup rolü kontrol
        const groupRes = await axios.get(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`);
        const group = groupRes.data.data.find(g => g.group.id == config.groupId);

        if (!group) {
          await interaction.followUp({ content: '❌ Roblox grubuna üye değilsiniz.', ephemeral: true });
          clearInterval(checkInterval);
          return;
        }

        const robloxRank = group.role.rank.toString();
        const discordRoleId = config.roleBindings[robloxRank];

        const member = await interaction.guild.members.fetch(userId);
        if (discordRoleId) {
          await member.roles.add(discordRoleId);
        }

        await member.roles.add(config.verifyRoleId);

        // Kayıt et
        verified[userId] = {
          robloxId,
          robloxUsername,
          timestamp: Date.now()
        };
        saveVerified(verified);

        // Log
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          logChannel.send(`✅ **${interaction.user.tag}** adlı kullanıcı **${robloxUsername}** olarak doğrulandı.`);
        }

        await interaction.followUp({ content: `✅ Başarıyla **${robloxUsername}** olarak doğrulandınız.`, ephemeral: true });
        clearInterval(checkInterval);
      } catch (err) {
        // ignore errors
      }
    }, 10000);
  }
};
