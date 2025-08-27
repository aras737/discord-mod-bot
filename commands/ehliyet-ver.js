const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyetim")
    .setDescription("Ehliyet bilgilerini detaylı kart şeklinde gösterir."),

  async execute(interaction) {
    const user = interaction.user;
    const ehliyet = await db.get(`ehliyet_${user.id}`);

    if (!ehliyet) {
      return interaction.reply({ content: "❌ Ehliyetin yok. Bir yönetici vermeli.", flags: 64 });
    }

    const robloxName = ehliyet.roblox || "Belirtilmemiş";
    const durum = ehliyet.durum || "Yok";
    const tarih = ehliyet.tarih || "Bilinmiyor";

    // Roblox avatar (headshot) URL
    let avatarUrl = user.displayAvatarURL();
    try {
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [robloxName] })
      });
      const data = await res.json();
      if (data?.data?.length) {
        const robloxId = data.data[0].id;
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`
        );
        const thumbData = await thumbRes.json();
        if (thumbData?.data?.length) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }
    } catch (e) {
      console.log("Roblox avatar alınamadı, Discord avatarı kullanılıyor.");
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "🚗 Dijital Ehliyet", iconURL: avatarUrl })
      .setColor("#2ecc71")
      .setThumbnail(avatarUrl)
      .addFields(
        { name: "👤 Roblox İsmi", value: `\`${robloxName}\``, inline: true },
        { name: "📌 Durum", value: `\`${durum}\``, inline: true },
        { name: "📅 Veriliş Tarihi", value: `\`${tarih}\``, inline: false }
      )
      .setImage("https://i.ibb.co/0j5mh5w/license-banner.png") // dekoratif arka plan (sen değiştirebilirsin)
      .setFooter({ text: "Resmî Dijital Ehliyet", iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
