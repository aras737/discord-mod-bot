const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Bir kullanıcının banını kaldırır.')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('Banı kaldırılacak kullanıcının ID\'si')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      await interaction.guild.members.unban(userId);

      // Ban listesinden sil
      let banList = [];
      if (fs.existsSync(banListPath)) {
        const raw = fs.readFileSync(banListPath);
        banList = JSON.parse(raw);

        banList = banList.filter(entry => entry.userId !== userId);

        fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));
      }

      await interaction.reply(`✅ <@${userId}> kullanıcısının banı kaldırıldı ve ban listesinden silindi.`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Ban kaldırma işlemi başarısız. ID doğru mu kontrol et.', ephemeral: true });
    }
  }
};
