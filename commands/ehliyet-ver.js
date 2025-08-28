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
    .setName("ehliyet-ver")
    .setDescription("Belirtilen kullanıcıya ehliyet verir.")
    .addUserOption(option =>
      option.setName("kullanici").setDescription("Ehliyet verilecek kişi").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("roblox").setDescription("Kullanıcının Roblox ismi").setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("kullanici");
    const robloxName = interaction.options.getString("roblox");

    // 👮‍♂️ Yetki kontrolü
    let member;
    try {
      member = await interaction.guild.members.fetch(interaction.user.id);
    } catch {
      return interaction.reply({ content: "⚠️ Sunucu bilgileri alınamadı.", flags: 64 });
    }

    if (!member.roles.cache.some(r => authorizedRoles.includes(r.id))) {
      return interaction.reply({
        content: "🚫 Bu komutu kullanmaya yetkin yok!",
        flags: 64
      });
    }

    // 📌 Ehliyeti kaydet
    await db.set(`ehliyet_${target.id}`, {
      roblox: robloxName,
      durum: "Var",
      tarih: new Date().toLocaleDateString("tr-TR")
    });

    // 🎨 Embed
    const embed = new EmbedBuilder()
      .setColor("#1abc9c")
      .setTitle("🚗 Dijital Ehliyet")
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription("🎉 **Yeni bir ehliyet oluşturuldu!**\nAşağıda bilgilerini bulabilirsin:")
      .addFields(
        { name: "👤 Discord", value: `${target.tag}`, inline: true },
        { name: "🕹️ Roblox", value: robloxName, inline: true },
        { name: "📌 Durum", value: "✅ Var", inline: true },
        { name: "📅 Veriliş Tarihi", value: new Date().toLocaleDateString("tr-TR"), inline: true }
      )
      .setFooter({ text: "Dijital Ehliyet Sistemi" })
      .setTimestamp();

    // Kullanıcıya DM gönder
    try {
      await target.send({ embeds: [embed] });
    } catch {
      await interaction.reply({
        content: `⚠️ ${target} kullanıcısına DM gönderilemedi, ama ehliyeti verildi.`,
        flags: 64
      });
    }

    return interaction.reply({
      content: `✅ ${target} kullanıcısına ehliyet verildi!`,
      embeds: [embed]
    });
  }
};
