const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

const GROUPS = [
  { id: 628577564, name: "[ TAG ] Askeri İnzibat" },
  { id: 446917818, name: "[ TAG ] Hava Kuvvetleri Komutanlığı" },
  { id: 223991124, name: "[ TAG ] Jandarma Genel Komutanlığı" },
  { id: 956137765, name: "[ TAG ] Kara Kuvvetleri Komutanlığı" },
  { id: 458142253, name: "[ TAG ] Özel Kuvvetler Komutanlığı" },
  { id: 954077255, name: "[ TAG ] Deniz Kuvvetleri Komutanlığı" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roblox-grup-sorgu")
    .setDescription("Bir Roblox kullanıcısının askeri gruplardaki durumunu sorgular.")
    .addStringOption(option =>
      option
        .setName("kullanici")
        .setDescription("Roblox kullanıcı adı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("kullanici");
    await interaction.deferReply();

    try {
      // Kullanıcı ID alma
      const userRes = await fetch(
        "https://users.roblox.com/v1/usernames/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [username] })
        }
      );

      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) {
        return interaction.editReply("Kullanıcı bulunamadı.");
      }

      const userId = userData.data[0].id;

      // Profil bilgisi
      const profileRes = await fetch(
        `https://users.roblox.com/v1/users/${userId}`
      );
      const profile = await profileRes.json();

      const banDurumu = profile.isBanned ? "Banlı" : "Temiz";

      // Grup bilgileri
      const groupRes = await fetch(
        `https://groups.roblox.com/v2/users/${userId}/groups/roles`
      );
      const groupData = await groupRes.json();

      let groupList = "";
      for (const group of GROUPS) {
        const found = groupData.data.find(
          g => g.group.id === group.id
        );

        if (found) {
          groupList += `${group.name}\nRol: ${found.role.name} (Rank ${found.role.rank})\n\n`;
        } else {
          groupList += `${group.name}\nDurum: Bulunamadı\n\n`;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Roblox Askeri Grup Sorgulama")
        .setColor(profile.isBanned ? 0xff0000 : 0x2f3136)
        .setThumbnail(
          `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`
        )
        .setDescription(
          `Kullanıcı Adı: ${profile.name}\n` +
          `Kullanıcı ID: ${userId}\n` +
          `Ban Durumu: ${banDurumu}\n\n` +
          `Grup Durumları:\n\n${groupList}`
        )
        .addFields({
          name: "Profil Bağlantısı",
          value: `https://www.roblox.com/users/${userId}/profile`
        })
        .setFooter({
          text: "Roblox Grup Denetim Sistemi"
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Roblox grup sorgu hatası:", error);
      await interaction.editReply(
        "Sorgu sırasında bir hata oluştu. Daha sonra tekrar deneyin."
      );
    }
  }
};
