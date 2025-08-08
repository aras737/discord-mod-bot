const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Banlanacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Ban sebebi')
        .setRequired(true) // ✅ Sebep zorunlu hale getirildi
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanici');
    const reason = interaction.options.getString('sebep');

    if (!member) {
      return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    }

    if (member.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Kendini banlayamazsın.', ephemeral: true });
    }

    try {
      await member.ban({ reason });

      const banData = fs.existsSync(banListPath)
        ? JSON.parse(fs.readFileSync(banListPath, 'utf8'))
        : {};

      banData[member.id] = {
        tag: member.user.tag,
        moderator: interaction.user.tag,
        reason,
        date: new Date().toISOString()
      };

      fs.writeFileSync(banListPath, JSON.stringify(banData, null, 2));

      await interaction.reply(`✅ ${member.user.tag} başarıyla banlandı.\n📝 Sebep: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Ban işlemi sırasında bir hata oluştu.', ephemeral: true });
    }
  }
};
