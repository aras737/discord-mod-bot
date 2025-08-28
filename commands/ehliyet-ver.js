const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Belirtilen kullanıcıya resmi dijital ehliyet verir.")
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
      durum: "Geçerli",
      tarih: new Date().toLocaleDateString("tr-TR")
    });

    // 🎨 Daha profesyonel embed
    const embed = new EmbedBuilder()
      .setColor("#0a74da")
      .setTitle("🛂 RESMİ DİJİTAL EHLİYET")
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription("Bu belge **dijital sürücü ehliyeti** olarak onaylanmıştır.\nAşağıdaki bilgiler kayıt altına alınmıştır:")
      .addFields(
        { name: "👤 Ad Soyad (Discord)", value: `${target.tag}`, inline: true },
        { name: "🕹️ Roblox Kullanıcı Adı", value: robloxName, inline: true },
        { name: "📌 Ehliyet Durumu", value: "✅ Geçerli", inline: true },
        { name: "📅 Veriliş Tarihi", value: new Date().toLocaleDateString("tr-TR"), inline: true }
      )
      .setFooter({
        text: "📜 Dijital Ehliyetler Kurumu • Yetkili Onay",
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    // Kullanıcıya DM gönder
    try {
      await target.send({ embeds: [embed] });
    } catch {
      await interaction.reply({
        content: `⚠️ ${target} kullanıcısına DM gönderilemedi, ama ehliyeti başarıyla verildi.`,
        ephemeral: true
      });
      return;
    }

    return interaction.reply({
      content: `✅ ${target} kullanıcısına **resmi dijital ehliyet** verildi!`,
      ephemeral: true
    });
  }
};
