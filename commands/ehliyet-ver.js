const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const axios = require("axios");

const db = new QuickDB();

// Yetkili roller (senin verdiğin ID'ler)
const authorizedRoles = [
  "1407831948721913956",
  "1407832580258004992",
  "1407832699665780947"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Belirtilen kullanıcıya dijital ehliyet verir.")
    .addUserOption(option =>
      option.setName("kullanici").setDescription("Ehliyet verilecek kişi").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("roblox").setDescription("Kullanıcının Roblox ismi").setRequired(true)
    ),

  async execute(interaction) {
    // ✅ Yetki kontrolü
    if (!interaction.member.roles.cache.some(r => authorizedRoles.includes(r.id))) {
      return interaction.reply({
        content: "🚫 Bu komutu kullanma yetkin yok!",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("kullanici");
    const robloxName = interaction.options.getString("roblox");

    // 📌 Roblox profil bilgileri al
    let robloxId, robloxAvatar;
    try {
      const resUser = await axios.post(`https://users.roblox.com/v1/usernames/users`, {
        usernames: [robloxName]
      });

      if (!resUser.data.data[0]) {
        return interaction.reply({ content: "🚫 Bu Roblox kullanıcı adı bulunamadı.", ephemeral: true });
      }

      robloxId = resUser.data.data[0].id;

      const resAvatar = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=720x720&format=Png&isCircular=false`
      );

      robloxAvatar = resAvatar.data.data[0].imageUrl;
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: "⚠️ Roblox verileri alınamadı.", ephemeral: true });
    }

    // 📌 Ehliyeti kaydet
    await db.set(`ehliyet_${target.id}`, {
      roblox: robloxName,
      durum: "Var",
      tarih: new Date().toLocaleDateString("tr-TR")
    });

    // 🎨 Daha havalı embed
    const embed = new EmbedBuilder()
      .setColor("#3498db")
      .setAuthor({ name: "Dijital Ehliyet Sistemi", iconURL: interaction.client.user.displayAvatarURL() })
      .setTitle("🚗 Dijital Ehliyet Kartı")
      .setThumbnail(robloxAvatar) // Roblox avatar
      .setDescription(`🎉 **${target} için ehliyet oluşturuldu!**`)
      .addFields(
        { name: "👤 Discord", value: `${target.tag}`, inline: true },
        { name: "🕹️ Roblox", value: `[${robloxName}](https://www.roblox.com/users/${robloxId}/profile)`, inline: true },
        { name: "📌 Durum", value: "✅ Aktif", inline: true },
        { name: "📅 Veriliş Tarihi", value: new Date().toLocaleDateString("tr-TR"), inline: true }
      )
      .setImage("https://i.imgur.com/mH0Jt3K.png") // ehliyet tarzı bir şerit (istersen değiştir)
      .setFooter({ text: "Yetkili onayıyla verildi.", iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Kullanıcıya DM gönder
    try {
      await target.send({ embeds: [embed] });
    } catch {
      await interaction.reply({
        content: `⚠️ ${target} kullanıcısına DM gönderilemedi, ama ehliyeti verildi.`,
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `✅ ${target} kullanıcısına ehliyet başarıyla verildi.`,
      embeds: [embed],
      ephemeral: true
    });
  }
};
