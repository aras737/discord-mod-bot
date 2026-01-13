const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const fetch = require("node-fetch");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const GROUP_ID = 33389098;
const MIN_RANK = 14;

/* ---------------- ROBLOX YETKİ KONTROL ---------------- */

async function hasPermission(username) {
  try {
    // Username -> UserId
    const userRes = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] })
      }
    );
    const userData = await userRes.json();
    if (!userData.data || userData.data.length === 0) return false;

    const userId = userData.data[0].id;

    // Grup bilgisi
    const groupRes = await fetch(
      `https://groups.roblox.com/v2/users/${userId}/groups/roles`
    );
    const groupData = await groupRes.json();

    const group = groupData.data.find(g => g.group.id === GROUP_ID);
    if (!group) return false;

    return group.role.rank >= MIN_RANK;
  } catch {
    return false;
  }
}

/* ---------------- SLASH KOMUT ---------------- */

module.exports = {
  data: new SlashCommandBuilder()
    .setName("karaliste")
    .setDescription("Roblox kara liste yönetim sistemi")
    .addStringOption(opt =>
      opt.setName("islem")
        .setDescription("Yapılacak işlem")
        .setRequired(true)
        .addChoices(
          { name: "Ekle", value: "ekle" },
          { name: "Sil", value: "sil" },
          { name: "Liste", value: "liste" }
        )
    )
    .addStringOption(opt =>
      opt.setName("yetkili")
        .setDescription("İşlemi yapan Roblox kullanıcı adı")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("hedef")
        .setDescription("Hedef Roblox kullanıcı adı")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("sebep")
        .setDescription("Kara liste sebebi")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const islem = interaction.options.getString("islem");
    const yetkili = interaction.options.getString("yetkili");
    const hedef = interaction.options.getString("hedef");
    const sebep = interaction.options.getString("sebep");
    const guildId = interaction.guild.id;

    /* -------- LİSTE -------- */
    if (islem === "liste") {
      const data = await db.get(`karaliste.${guildId}`);
      if (!data) {
        return interaction.editReply(
          "Kara listede kayıtlı kullanıcı bulunmamaktadır."
        );
      }

      let text = "";
      for (const [user, info] of Object.entries(data)) {
        text +=
          `Kullanıcı: ${user}\n` +
          `Sebep: ${info.sebep}\n` +
          `Yetkili: ${info.ekleyen}\n` +
          `Tarih: ${new Date(info.tarih).toLocaleString("tr-TR")}\n\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle("Kara Liste")
        .setColor(0x2f3136)
        .setDescription(text)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    /* -------- EKLE / SİL YETKİ KONTROL -------- */
    if (!yetkili || !hedef) {
      return interaction.editReply(
        "Yetkili ve hedef kullanıcı adı belirtilmelidir."
      );
    }

    const yetki = await hasPermission(yetkili);
    if (!yetki) {
      return interaction.editReply(
        "Bu işlemi yapabilmek için gerekli Roblox grup yetkisine sahip değilsiniz."
      );
    }

    /* -------- EKLE -------- */
    if (islem === "ekle") {
      if (!sebep) {
        return interaction.editReply("Kara liste sebebi belirtilmelidir.");
      }

      await db.set(`karaliste.${guildId}.${hedef}`, {
        sebep,
        ekleyen: yetkili,
        tarih: Date.now()
      });

      const embed = new EmbedBuilder()
        .setTitle("Kara Liste Güncellemesi")
        .setColor(0x2f3136)
        .addFields(
          { name: "Kullanıcı", value: hedef },
          { name: "Sebep", value: sebep },
          { name: "Yetkili", value: yetkili }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    /* -------- SİL -------- */
    if (islem === "sil") {
      await db.delete(`karaliste.${guildId}.${hedef}`);

      const embed = new EmbedBuilder()
        .setTitle("Kara Liste Güncellemesi")
        .setColor(0x2f3136)
        .setDescription(
          `Kullanıcı kara listeden çıkarıldı.\n\nKullanıcı: ${hedef}\nYetkili: ${yetkili}`
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
