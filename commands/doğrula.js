const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('doğrula')
    .setDescription('Roblox kullanıcı adını doğrular')
    .addStringOption(option =>
      option.setName('kullanıcı')
        .setDescription('Doğrulanacak Roblox kullanıcı adı')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const username = interaction.options.getString('kullanıcı');

    await interaction.deferReply();

    try {
      // Roblox API: Kullanıcıyı bul
      const res = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
        data: {
          usernames: [username],
          excludeBannedUsers: true
        }
      });

      const userData = res.data.data[0];

      if (!userData) {
        return interaction.editReply(`❌ Kullanıcı **${username}** bulunamadı.`);
      }

      // Doğrulama başarılı
      return interaction.editReply(`✅ **${userData.name}** başarıyla doğrulandı!\nID: \`${userData.id}\``);
    } catch (error) {
      console.error('🚨 API hatası:', error.message);
      return interaction.editReply('❌ Doğrulama sırasında bir hata oluştu. Lütfen tekrar dene.');
    }
  }
};
