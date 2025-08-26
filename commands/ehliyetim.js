const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const canvacord = require("canvacord"); // v5/v6 ile uyumlu
// Node 18+ sürümlerde fetch globaldir (Node 22 kullanıyorsun). Ayrı paket gerekmez.

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyetim")
    .setDescription("Roblox bilgilerinle ehliyetini görsel kart olarak gösterir."),

  async execute(interaction) {
    const user = interaction.user;
    const ehliyet = await db.get(`ehliyet_${user.id}`);

    if (!ehliyet) {
      return interaction.reply({ content: "❌ Ehliyetin yok. Bir yönetici vermeli.", flags: 64 });
    }

    const robloxName = ehliyet.roblox || "Belirtilmemiş";

    // 1) Roblox ID'yi bul
    let robloxId = null;
    try {
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [robloxName] })
      });
      const data = await res.json();
      if (data?.data?.length) robloxId = data.data[0].id;
    } catch (e) {
      // Sessiz geç: avatar için fallback kullanacağız
    }

    // 2) Roblox avatar headshot URL'si
    let avatarUrl =
      "https://tr.rbxcdn.com/3f95cb2c13a9d9c88a4f5bb9d3e45d68/150/150/AvatarHeadshot/Png"; // fallback
    if (robloxId) {
      try {
        const t = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`);
        const td = await t.json();
        if (td?.data?.length && td.data[0].imageUrl) {
          avatarUrl = td.data[0].imageUrl;
        }
      } catch (e) {}
    }

    // 3) Canvacord ile görsel oluştur
    // Önce Welcomer kartı (başlık + açıklama yazılabildiği için ehliyet bilgileri şık görünür)
    try {
      const welcomer = new canvacord.Welcomer()
        .setUsername(robloxName)
        .setDiscriminator("0000") // gösterim için
        .setAvatar(avatarUrl)
        .setTitle("🚗 Roblox Dijital Ehliyet")
        .setDescription(`📌 Durum: ${ehliyet.durum}\n📅 Tarih: ${ehliyet.tarih}`)
        .setBackground("COLOR", "#1e1e2f")
        .setTextColor("#ecf0f1")
        .setOpacity(0.85);

      const buffer = await welcomer.build();
      const attachment = new AttachmentBuilder(buffer, { name: "ehliyet.png" });
      return interaction.reply({ files: [attachment] });
    } catch (e) {
      // Eğer kullandığın Canvacord sürümünde Welcomer yoksa RankCard’a düşelim:
      try {
        const card = new canvacord.RankCard()
          .setAvatar(avatarUrl)
          .setUsername(robloxName)
          .setDiscriminator("0000")
          .setBackground("COLOR", "#1e1e2f")
          .setOverlay("#000000", 0.35)
          .setProgressBar("#3498db", "COLOR")
          .setCurrentXP(100).setRequiredXP(100)
          .setLevel(1)
          .setRank(0, "Ehliyet", false);

        const buffer = await card.build();
        const attachment = new AttachmentBuilder(buffer, { name: "ehliyet.png" });
        return interaction.reply({
          content: "ℹ️ Welcomer şablonu bulunamadı, RankCard ile gösterildi.",
          files: [attachment]
        });
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: "❌ Görsel oluşturulamadı. Canvacord sürümünü kontrol et.", flags: 64 });
      }
    }
  }
};
