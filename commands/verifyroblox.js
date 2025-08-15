const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const DATA_FILE = './verified.json';
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Roblox hesabınızı doğrulamak için kod alın')
    .addStringOption(option =>
      option.setName('roblox_username')
        .setDescription('Roblox kullanıcı adınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const robloxUsername = interaction.options.getString('roblox_username');
    const code = Math.random().toString(36).substring(2, 10);

    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    data[userId] = { robloxUsername, code };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    await interaction.reply({
      content: `🔑 Doğrulama kodunuz: **${code}**\nLütfen Roblox profilinizin açıklama kısmına ekleyin ve ardından **/verifykontrol** komutunu kullanın.`,
      ephemeral: true
    });
  }
};
