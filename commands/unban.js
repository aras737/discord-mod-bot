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
        .setDescription('Banı kaldırılacak kullanıcının ID’si')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için `Üyeleri Yasakla` iznin olmalı.', ephemeral: true });
    }

    const userId = interaction.options.getString('userid');

    try {
      await interaction.guild.bans.remove(userId, `Unban | Yetkili: ${interaction.user.tag}`);

      // JSON'dan sil
      if (fs.existsSync(banListPath)) {
        let banList = JSON.parse(fs.readFileSync(banListPath));
        banList = banList.filter(entry => entry.userId !== userId);
        fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));
      }

      await interaction.reply(`✅ <@${userId}> kullanıcısının banı kaldırıldı.`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Unban işlemi başarısız.', ephemeral: true });
    }
  },
};
