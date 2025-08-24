const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Ban kayıtlarının tutulduğu JSON dosyası
const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar, DM gönderir ve listeye ekler.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Banlanacak kullanıcıyı seçin.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Ban sebebi (örneğin: spam, hakaret, vs)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Bu kullanıcı sunucuda bulunamıyor.', ephemeral: true });
    }

    try {
      // Kullanıcıya DM gönder
      await user.send(`🚫 **${interaction.guild.name}** sunucusundan banlandın.\n📌 Sebep: **${reason}**\n👮 Yetkili: ${interaction.user.tag}`).catch(() => {
        console.log(`⚠️ ${user.tag} kişisine DM gönderilemedi (kapalı olabilir).`);
      });

      // Banla
      await member.ban({ reason: `${reason} | Yetkili: ${interaction.user.tag}` });

      // Ban listesine kaydet
      let banList = [];
      if (fs.existsSync(banListPath)) {
        const raw = fs.readFileSync(banListPath);
        banList = JSON.parse(raw);
      }

      banList.push({
        userId: user.id,
        tag: user.tag,
        reason: reason,
        bannedBy: interaction.user.tag,
        date: new Date().toISOString()
      });

      fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));

      await interaction.reply(`✅ ${user.tag} sunucudan banlandı. Sebep: **${reason}**`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Ban işlemi başarısız.', ephemeral: true });
    }
  }
};
