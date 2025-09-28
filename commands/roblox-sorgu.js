const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roblox-sorgu")
    .setDescription("Roblox kullanıcısını sorgular")
    .addStringOption(option =>
      option.setName("kullanici")
        .setDescription("Roblox kullanıcı adı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("kullanici");
    await interaction.deferReply();

    try {
      // 1. Kullanıcı ID bul
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) {
        return interaction.editReply("❌ Kullanıcı bulunamadı.");
      }

      const user = userData.data[0];
      const userId = user.id;

      // 2. Grup rütbesi
      const groupId = https: 17167324; // Buraya kendi grup ID’nizi yaz
      const groupRes = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      const groupData = await groupRes.json();

      let rank = "Bu grupta değil";
      const groupInfo = groupData.find(g => g.group.id === groupId);
      if (groupInfo) {
        rank = groupInfo.role.name;
      }

      // 3. Ban kontrol (quick.db'de "banned_users" listesi varsayıyoruz)
      const banned = await db.get(`banned_${userId}`);
      const isBanned = banned ? "Evet" : "Hayır";

      // 4. Embed oluştur
      const embed = new EmbedBuilder()
        .setTitle(`${user.name} Kullanıcı Bilgisi`)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
        .addFields(
          { name: "Roblox ID", value: userId.toString(), inline: true },
          { name: "Rütbe", value: rank, inline: true },
          { name: "Banlı mı?", value: isBanned, inline: true }
        )
        .setColor(isBanned === "Evet" ? "Red" : "Green")
        .setFooter({ text: "Roblox Sorgu Sistemi" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      return interaction.editReply("❌ Sorgulama sırasında hata oluştu.");
    }
  }
};
