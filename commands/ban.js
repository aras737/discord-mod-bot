const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı kalıcı olarak sunucudan yasaklar.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Banlanacak kullanıcıyı seçin.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Ban sebebi (örnek: spam, hakaret, vb.)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için `Üyeleri Yasakla` iznin olmalı.', ephemeral: true });
    }

    const user = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    try {
      // DM gönder
      await user.send(
        `🚫 **${interaction.guild.name}** sunucusundan **kalıcı olarak** yasaklandın.\n📌 Sebep: **${reason}**\n👮 Yetkili: ${interaction.user.tag}`
      ).catch(() => {
        console.log(`⚠️ ${user.tag} kişisine DM gönderilemedi (kapalı olabilir).`);
      });

      // Kalıcı ban
      await interaction.guild.bans.create(user.id, {
        reason: `${reason} | Yetkili: ${interaction.user.tag}`,
      });

      // JSON'a kaydet
      let banList = [];
      if (fs.existsSync(banListPath)) {
        banList = JSON.parse(fs.readFileSync(banListPath));
      }

      banList.push({
        userId: user.id,
        tag: user.tag,
        reason: reason,
        bannedBy: interaction.user.tag,
        date: new Date().toISOString(),
      });

      fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));

      await interaction.reply(`✅ ${user.tag} kalıcı olarak yasaklandı. Sebep: **${reason}**`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Ban işlemi başarısız.', ephemeral: true });
    }
  },
};
