const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, '..', 'banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı banlar ve ban listesini kaydeder.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Banlanacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Ban sebebi')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanici');
    const reason = interaction.options.getString('sebep') || `Sebep belirtilmedi. Banlayan: ${interaction.user.tag}`;

    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok.', ephemeral: true });
    }

    if (!member) {
      return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    }

    if (member.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Kendini banlayamazsın.', ephemeral: true });
    }

    try {
      // Banla
      await member.ban({ reason });

      // Ban listesini oku
      let banList = [];
      if (fs.existsSync(banListPath)) {
        const data = fs.readFileSync(banListPath, 'utf8');
        banList = JSON.parse(data);
      }

      // Ban bilgisini ekle
      banList.push({
        id: member.id,
        tag: member.user.tag,
        reason,
        date: new Date().toISOString(),
        bannedBy: interaction.user.tag
      });

      // Dosyaya kaydet
      fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));

      await interaction.reply(`✅ ${member.user.tag} başarıyla banlandı.\n📝 Sebep: *${reason}*\n📋 Ban listesine kaydedildi.`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Ban işlemi başarısız oldu.', ephemeral: true });
    }
  }
};
