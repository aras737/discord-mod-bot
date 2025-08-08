const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ban listesi yolu
const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Banlanacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Ban sebebi')
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    if (!member) {
      return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    }

    if (!member.bannable) {
      return interaction.reply({ content: '❌ Bu kullanıcı banlanamıyor.', ephemeral: true });
    }

    try {
      // Kullanıcıyı banla
      await member.ban({ reason: `${reason} | Banlayan: ${interaction.user.tag}` });

      // Ban listesine kaydet
      let banList = {};
      if (fs.existsSync(banListPath)) {
        banList = JSON.parse(fs.readFileSync(banListPath, 'utf8'));
      }

      banList[member.user.id] = {
        tag: member.user.tag,
        reason: reason,
        moderator: interaction.user.tag,
        date: new Date().toISOString()
      };

      fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));

      await interaction.reply(`✅ **${member.user.tag}** başarıyla banlandı.\n📝 Sebep: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Ban işlemi sırasında bir hata oluştu.', ephemeral: true });
    }
  }
};
