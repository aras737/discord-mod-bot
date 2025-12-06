const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roblox-sorgu")
    .setDescription("🔎 Bir Roblox kullanıcısı hakkında detaylı sorgu yapar.")
    .addStringOption(option =>
      option
        .setName("kullanici")
        .setDescription("Sorgulanacak Roblox kullanıcı adı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("kullanici");
    const groupId = 33389098;

    await interaction.deferReply();

    try {
      // === Kullanıcı ID ===
      const resUser = await fetch(`https://users.roblox.com/v1/usernames/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await resUser.json();

      if (!userData.data || userData.data.length === 0) {
        return interaction.editReply("❌ **Kullanıcı bulunamadı.**");
      }

      const userId = userData.data[0].id;

      // === Kullanıcı detayları (yaş için gerekli) ===
      const resUserInfo = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      const userInfo = await resUserInfo.json();

      const createdDate = new Date(userInfo.created);
      const now = new Date();
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffYears = Math.floor(diffDays / 365);
      const diffMonths = Math.floor((diffDays % 365) / 30);
      const accountAge = `🗓 ${diffYears} yıl, ${diffMonths} ay (${diffDays} gün)`;

      // === Tüm grup bilgileri ===
      const resGroup = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groupData = await resGroup.json();

      let groupList = "Kullanıcı hiçbir grupta değil.";

      if (groupData.data && groupData.data.length > 0) {
        groupList = groupData.data
          .map(g => 
            `**${g.group.name}**  
              🔗 [Grup Linki](https://www.roblox.com/groups/${g.group.id})  
              💼 Rol: **${g.role.name}**  
              📊 Rank: **${g.role.rank}**  
            `
          )
          .join("\n");
      }

      // === Avatar bilgileri ===
      const headshot = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`;
      const fullAvatar = `https://www.roblox.com/avatar-thumbnail/image?userId=${userId}&width=720&height=720&format=png`;
      const profileLink = `https://www.roblox.com/users/${userId}/profile`;

      // === Embed ===
      const embed = new EmbedBuilder()
        .setTitle(`🛡 Roblox Kullanıcı Sorgusu`)
        .setDescription(`📌 **${username}** hakkında detaylı bilgiler:`)
        .setURL(profileLink)
        .setThumbnail(headshot)
        .setImage(fullAvatar)
        .addFields(
          { name: "🆔 Kullanıcı ID", value: `\`${userId}\``, inline: true },
          { name: "📅 Hesap Yaşı", value: accountAge, inline: true },
          { name: "🔗 Profil", value: `[Roblox Profilini Aç](${profileLink})`, inline: true },
          { name: "👥 Kullanıcı Grupları", value: groupList }
        )
        .setColor(0x00ccff)
        .setFooter({ text: "🔎 Roblox Detaylı Sorgu Sistemi" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Roblox sorgu hatası:", error);
      await interaction.editReply("❌ **Bir hata oluştu.** Lütfen tekrar deneyin.");
    }
  }
};
