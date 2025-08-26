const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyetim")
    .setDescription("Ehliyetini görsel kart olarak gösterir."),

  async execute(interaction) {
    const user = interaction.user;
    const ehliyet = await db.get(`ehliyet_${user.id}`);

    if (!ehliyet) {
      return interaction.reply({ content: "❌ Ehliyetin yok. Bir yönetici vermeli.", flags: 64 });
    }

    // Canvas boyutu
    const canvas = createCanvas(500, 250);
    const ctx = canvas.getContext("2d");

    // Arkaplan
    ctx.fillStyle = "#1e1e2f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Başlık
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px Arial Bold";
    ctx.fillText("🚗 Dijital Ehliyet", 150, 50);

    // Profil fotoğrafı
    const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 128 }));
    ctx.drawImage(avatar, 30, 80, 100, 100);

    // Bilgiler
    ctx.fillStyle = "#ecf0f1";
    ctx.font = "20px Arial";
    ctx.fillText(`👤 İsim: ${user.username}`, 150, 100);
    ctx.fillText(`📌 Durum: ${ehliyet.durum}`, 150, 140);
    ctx.fillText(`📅 Tarih: ${ehliyet.tarih}`, 150, 180);

    // Çizgi
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Çıktı
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "ehliyet.png" });
    return interaction.reply({ files: [attachment] });
  }
};
