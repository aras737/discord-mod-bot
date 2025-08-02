const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const ROBLOX_GROUP_ID = 'GRUP_ID_HERE';       // Roblox grup ID'nizi buraya yazın
const VERIFY_ROLE_ID = 'ROL_ID_HERE';          // Discord'da verilecek rolün ID'si
const GUILD_ID = 'DISCORD_SUNUCU_ID_HERE';    // Discord sunucu ID'niz

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox grubuna üyeliğinizi doğrular ve rol verir.')
    .addStringOption(option =>
      option.setName('kullanici')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanici');

    try {
      // 1) Roblox kullanıcı ID'sini al
      const userRes = await axios.get('https://users.roblox.com/v1/usernames/users', {
        data: { usernames: [username], excludeBannedUsers: false }
      });

      const userData = userRes.data.data[0];
      if (!userData) return interaction.reply({ content: '❌ Roblox kullanıcısı bulunamadı.', ephemeral: true });

      const userId = userData.id;

      // 2) Kullanıcının grup üyeliğini kontrol et
      const groupsRes = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groups = groupsRes.data.data;

      const isMember = groups.some(g => g.group.id === Number(ROBLOX_GROUP_ID));
      if (!isMember) {
        return interaction.reply({ content: '❌ Roblox grubumuzda üye değilsiniz.', ephemeral: true });
      }

      // 3) Discord üyesini al
      const guild = interaction.client.guilds.cache.get(GUILD_ID);
      if (!guild) return interaction.reply({ content: '❌ Sunucu bulunamadı.', ephemeral: true });

      const member = await guild.members.fetch(interaction.user.id);

      // 4) Role ekle
      if (member.roles.cache.has(VERIFY_ROLE_ID)) {
        return interaction.reply({ content: '✅ Zaten doğrulandınız.', ephemeral: true });
      }

      await member.roles.add(VERIFY_ROLE_ID);

      return interaction.reply({ content: `✅ Başarıyla doğrulandınız ve rolünüz verildi!`, ephemeral: true });

    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ Doğrulama sırasında bir hata oluştu.', ephemeral: true });
    }
  }
};
