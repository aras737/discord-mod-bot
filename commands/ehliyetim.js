const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyetim")
    .setDescription("Ehliyetini görsel kart olarak gösterir."),

  async execute(interaction) {
    const user = interaction.user;
    const ehliyet = db.get(`ehliyet_${user.id}`);

    if (!ehliyet) {
      return interaction.reply({ content: "❌ Ehliyetin yok. `/ehliyet-al` komutunu kullan!", ephemeral: true });
    }

    // Canvas ile görsel oluştur
    const canvas = createCanvas(400, 200);
    const ctx = canvas.getContext("2d");

    // Arkaplan
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Profil fotoğrafı
    const avatar = await loadImage(user.displayAvatarURL({ extension: "png" }));
    ctx.drawImage(avatar, 20, 40, 80, 80);

    // Yazılar
    ctx.fillStyle = "#ecf0f1";
    ctx.font = "20px Arial";
    ctx.fillText("🚗 Ehliyet Kartı", 120, 40);
    ctx.font = "16px Arial";
    ctx.fillText(`İsim: ${user.username}`, 120, 80);
    ctx.fillText(`Durum: ${ehliyet.durum}`, 120, 110);
    ctx.fillText(`Tarih: ${ehliyet.tarih}`, 120, 140);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "ehliyet.png" });

    return interaction.reply({ files: [attachment] });
  }
};
