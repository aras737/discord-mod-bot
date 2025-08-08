const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabınızı doğrular.')
    .addStringOption(option =>
      option.setName('kullanici')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const verifyChannelId = process.env.VERIFY_CHANNEL_ID;
    const verifyLogChannelId = process.env.VERIFY_LOG_CHANNEL_ID;
    const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
    const groupId = process.env.GROUP_ID;

    if (interaction.channel.id !== verifyChannelId) {
      return interaction.reply({ content: '❌ Bu komut sadece doğrulama kanalında kullanılabilir.', ephemeral: true });
    }

    const username = interaction.options.getString('kullanici');
    await interaction.deferReply({ ephemeral: true });

    try {
      // Kullanıcıyı çek
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: true
      });

      const userData = userRes.data.data[0];
      if (!userData) {
        return interaction.editReply({ content: '❌ Kullanıcı bulunamadı.' });
      }

      const userId = userData.id;

      // Gruba üyeliğini kontrol et
      const groupRes = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      const groups = groupRes.data.data;

      const groupMember = groups.find(g => g.group.id == groupId);

      if (!groupMember) {
        return interaction.editReply({ content: '❌ Bu kullanıcı grupta değil.' });
      }

      // Rol ver
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(verifiedRoleId);

      await interaction.editReply({ content: `✅ ${username} başarıyla doğrulandı!` });

      // Log
      const logChannel = await interaction.guild.channels.fetch(verifyLogChannelId).catch(() => null);
      if (logChannel?.isTextBased()) {
        logChannel.send(`✅ **${interaction.user.tag}** adlı kullanıcı \`${username}\` olarak doğrulandı. Grupta bulundu.`);
      }

    } catch (error) {
      console.error('❌ Doğrulama hatası:', error.response?.data || error);
      return interaction.editReply({ content: '❌ Doğrulama sırasında bir hata oluştu.' });
    }
  }
};
