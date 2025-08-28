const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

// Yetkili roller
const authorizedRoles = [
  "1407831948721913956",
  "1407832580258004992",
  "1407832699665780947"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-al")
    .setDescription("Belirtilen kişinin ehliyetini elinden alır.")
    .addUserOption(option =>
      option.setName("kullanici").setDescription("Ehliyeti alınacak kişi").setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "⚠️ Bu komut sadece sunucuda kullanılabilir.", flags: 64 });
    }

    const target = interaction.options.getUser("kullanici");

    // 👮 Yetki kontrolü
    let member;
    try {
      member = await interaction.guild.members.fetch(interaction.user.id);
    } catch {
      return interaction.reply({ content: "⚠️ Sunucu üyeleri alınamadı.", flags: 64 });
    }

    if (!member.roles.cache.some(r => authorizedRoles.includes(r.id))) {
      return interaction.reply({ content: "🚫 Bu komutu kullanmaya yetkin yok!", flags: 64 });
    }

    // 📌 Ehliyet var mı kontrol et
    const ehliyet = await db.get(`ehliyet_${target.id}`);
    if (!ehliyet) {
      return interaction.reply({ content: `❌ ${target} kullanıcısının ehliyeti zaten yok.`, flags: 64 });
    }

    // 📌 Ehliyeti sil
    await db.delete(`ehliyet_${target.id}`);

    // 🎨 Embed
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🚫 Ehliyet İptali")
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription(`⚠️ ${target} adlı kişinin ehliyeti **elinden alındı!**`)
      .setFooter({ text: "Dijital Ehliyet Sistemi" })
      .setTimestamp();

    return interaction.reply({ content: `🚫 ${target} kullanıcısının ehliyeti alındı!`, embeds: [embed] });
  }
};
