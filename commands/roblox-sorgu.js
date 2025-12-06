const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roblox-sorgu")
    .setDescription("Bir Roblox kullanıcısını sorgular")
    .addStringOption(option =>
      option
        .setName("kullanici")
        .setDescription("Roblox kullanıcı adı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("kullanici");
    const groupId = 33389098; // Buraya kendi Roblox grup ID’nizi yaz

    await interaction.deferReply();

    try {
      // Kullanıcı ID'sini al
      const resUser = await fetch(`https://users.roblox.com/v1/usernames/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await resUser.json();
      if (!userData.data || userData.data.length === 0) {
        return interaction.editReply("❌ Kullanıcı bulunamadı.");
      }

      const userId = userData.data[0].id;

      // Grup bilgisi al
      const resGroup = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groupData = await resGroup.json();

      const groupInfo = groupData.data.find(g => g.group.id === groupId);

      let roleName = "Bu grupta değil";
      if (groupInfo) {
        roleName = `${groupInfo.role.name} (Rank: ${groupInfo.role.rank})`;
      }

      // Ban sorgusu
      const resBan = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      const banData = await resBan.json();

      let isBanned = false;
      if (banData.errors && banData.errors.some(e => e.message.includes("banned"))) {
        isBanned = true;
      }

      // Embed hazırla
      const embed = new EmbedBuilder()
        .setTitle(`Roblox Sorgu: ${username}`)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
        .addFields(
          { name: "Kullanıcı ID", value: userId.toString(), inline: true },
          { name: "Grup Rolü", value: roleName, inline: true },
          { name: "Ban Durumu", value: isBanned ? "🚫 Banlı" : "✅ Banlı değil", inline: true }
        )
        .setColor(isBanned ? "Red" : "Green")
        .setFooter({ text: "Roblox sorgulama sistemi" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Roblox sorgu hatası:", error);
      await interaction.editReply("❌ Bir hata oluştu, lütfen tekrar deneyin.");
    }
  }
};
