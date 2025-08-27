const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const { createCanvas } = require("canvas");

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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // sadece admin

  async execute(interaction) {
    const target = interaction.options.getUser("kullanici");
    const robloxName = interaction.options.getString("roblox");

    // 📌 Ehliyeti kaydet
    await db.set(`ehliyet_${target.id}`, {
      roblox: robloxName,
      durum: "Var",
      tarih: new Date().toLocaleDateString("tr-TR")
    });

    // 🎨 Ehliyet kartı oluştur
    const width = 600;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arka plan
    ctx.fillStyle = "#1abc9c";
    ctx.fillRect(0, 0, width, height);

    // Başlık
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Sans";
    ctx.fillText("🚗 Dijital Ehliyet", 30, 50);

    // Kullanıcı bilgileri
    ctx.font = "20px Sans";
    ctx.fillStyle = "#2c3e50";
    ctx.fillText(`Discord: ${target.tag}`, 30, 120);
    ctx.fillText(`Roblox: ${robloxName}`, 30, 160);
    ctx.fillText(`Durum: Var`, 30, 200);
    ctx.fillText(`Veriliş: ${new Date().toLocaleDateString("tr-TR")}`, 30, 240);

    // Buffer
    const buffer = canvas.toBuffer("image/png");

    // Kullanıcıya DM gönder
    try {
      await target.send({
        content: "🎉 Tebrikler! Sana yeni bir ehliyet verildi.",
        files: [{ attachment: buffer, name: "ehliyet.png" }]
      });
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
