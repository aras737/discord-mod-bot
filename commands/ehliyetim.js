const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const fetch = require("node-fetch"); // npm install node-fetch@2

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

    // Roblox ID bul
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [robloxName] })
    });
    const data = await res.json();

    let avatarUrl = "https://tr.rbxcdn.com/3f95cb2c13a9d9c88a4f5bb9d3e45d68/150/150/AvatarHeadshot/Png";
    if (data.data && data.data.length > 0) {
      const robloxId = data.data[0].id;
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`);
      const thumbData = await thumbRes.json();
      if (thumbData.data && thumbData.data.length > 0) {
        avatarUrl = thumbData.data[0].imageUrl;
      }
    }

    // Canvas
    const canvas = createCanvas(500, 250);
    const ctx = canvas.getContext("2d");

    // Arkaplan
    ctx.fillStyle = "#1e1e2f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Başlık
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";   // Sans-serif garanti çalışır
    ctx.fillText("🚗 Roblox Dijital Ehliyet", 90, 50);

    // Avatar
    try {
      const avatar = await loadImage(avatarUrl);
      ctx.drawImage(avatar, 30, 80, 100, 100);
    } catch {
      // avatar yüklenemezse boş geç
    }

    // Yazılar
    ctx.fillStyle = "#ecf0f1";
    ctx.font = "20px sans-serif";
    ctx.fillText(`👤 Roblox: ${robloxName}`, 150, 100);
    ctx.fillText(`📌 Durum: ${ehliyet.durum}`, 150, 140);
    ctx.fillText(`📅 Tarih: ${ehliyet.tarih}`, 150, 180);

    // Çerçeve
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "ehliyet.png" });
    return interaction.reply({ files: [attachment] });
  }
};
