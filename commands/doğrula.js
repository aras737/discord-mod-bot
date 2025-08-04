const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabınızı doğrular')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)),
  
  async execute(interaction) {
    const username = interaction.options.getString('username');

    // Roblox kullanıcı adını ID'ye çevir
    const userId = await getRobloxId(username);
    if (!userId) {
      return interaction.reply({ content: 'Böyle bir Roblox kullanıcısı bulunamadı.', ephemeral: true });
    }

    // İstersen grup üyeliği kontrolü yapabilirsin
    const inGroup = await checkUserInGroup(userId, 1234567); // Grup ID'sini değiştir

    if (inGroup) {
      await interaction.reply({ content: `${username} Roblox grubunda doğrulandı!`, ephemeral: false });
    } else {
      await interaction.reply({ content: `${username} Roblox grubunda değil.`, ephemeral: true });
    }
  },
};

async function getRobloxId(username) {
  try {
    const res = await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.Id || null;
  } catch {
    return null;
  }
}

async function checkUserInGroup(userId, groupId) {
  try {
    const res = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.data.some(g => g.group.id === groupId);
  } catch {
    return false;
  }
}
