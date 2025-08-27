const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Belirtilen kullanıcıya ehliyet verir.")
    .addUserOption(option =>
      option.setName("kullanici").setDescription("Ehliyet verilecek kişi").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("roblox").setDescription("Kullanıcının Roblox ismi").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser("kullanici");
    const robloxName = interaction.options.getString("roblox");

    // 📌 Ehliyeti kaydet
    await db.set(`ehliyet_${target.id}`, {
      roblox: robloxName,
      durum: "Var",
      tarih: new Date().toLocaleDateString("tr-TR")
    });

    // 🎨 Embed (Havalı kart tasarımı)
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
      .setFooter({ text: "Dijital Ehliyet Sistemi", iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    // Kullanıcıya DM gönder
    try {
      await target.send({ embeds: [embed] });
    } catch {
      return interaction.reply({
        content: `⚠️ ${target} kullanıcısına DM gönderilemedi, ama ehliyeti verildi.`,
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `✅ ${target} kullanıcısına ehliyet verildi!`,
      ephemeral: true
    });
  }
};
