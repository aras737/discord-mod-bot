const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

const authorizedRoles = [
  "1407831948721913956", 
  "1407832580258004992", 
  "1407832699665780947"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-al")
    .setDescription("Belirtilen kişinin ehliyetini alır.")
    .addUserOption(option =>
      option.setName("kullanici").setDescription("Ehliyeti alınacak kişi").setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("kullanici");

    // Guild üyesini garantiye al
    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Yetki kontrolü
    if (!member.roles.cache.some(r => authorizedRoles.includes(r.id))) {
      return interaction.reply({
        content: "🚫 Bu komutu kullanmaya yetkin yok!",
        flags: 64 // ephemeral yerine flags kullanıldı
      });
    }

    // Ehliyet kontrol
    const data = await db.get(`ehliyet_${target.id}`);
    if (!data) {
      return interaction.reply({
        content: `🚫 ${target} kullanıcısının kayıtlı ehliyeti bulunamadı.`,
        flags: 64
      });
    }

    // Ehliyeti sil
    await db.delete(`ehliyet_${target.id}`);

    // Embed
    const embed = new EmbedBuilder()
      .setColor("#c0392b")
      .setTitle("🚔 Dijital Ehliyet İptali")
      .setDescription("📌 Bir ehliyet resmen **iptal edilmiştir.**")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "👤 Kullanıcı", value: `${target.tag}`, inline: true },
        { name: "🕹️ Roblox", value: data.roblox, inline: true },
        { name: "📅 Veriliş Tarihi", value: data.tarih, inline: true },
        { name: "⚠️ Durum", value: "❌ İptal Edildi", inline: true }
      )
      .setFooter({ text: "Dijital Ehliyet Sistemi - Resmi İptal Kaydı" })
      .setTimestamp();

    try {
      await target.send({
        content: "🚨 Ehliyetin iptal edildi! Daha fazla işlem için yetkililerle iletişime geç.",
        embeds: [embed]
      });
    } catch {}

    return interaction.reply({
      content: `✅ ${target} kullanıcısının ehliyeti iptal edildi.`,
      embeds: [embed]
    });
  }
};
