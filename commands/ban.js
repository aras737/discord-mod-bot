const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir kullanıcıyı kalıcı olarak yasaklar.")
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Yasaklanacak kullanıcı")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sebep")
        .setDescription("Yasaklama sebebi")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser("kullanıcı");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi";

    try {
      // 📌 DM gönder (başarısız olursa sorun olmaz)
      await target.send(`Kalıcı olarak ${interaction.guild.name} sunucusundan yasaklandınız.\nSebep: ${reason}`).catch(() => {});

      // 📌 Kullanıcıyı banla
      await interaction.guild.members.ban(target.id, { reason });

      // 📌 Banlist veritabanına kaydet
      const entry = {
        id: target.id,
        tag: target.tag,
        reason,
        by: interaction.user.tag,
        date: new Date().toLocaleString("tr-TR")
      };

      let banlist = await db.get(`banlist_${interaction.guild.id}`) || [];
      banlist.push(entry);
      await db.set(`banlist_${interaction.guild.id}`, banlist);

      // 📌 Embed yanıtı
      const embed = new EmbedBuilder()
        .setTitle("Kalıcı Yasaklama Uygulandı")
        .addFields(
          { name: "Yasaklanan", value: `${target.tag} (${target.id})` },
          { name: "Sebep", value: reason },
          { name: "Yetkili", value: interaction.user.tag },
          { name: "Durum", value: "Sonsuza dek yasaklandı" }
        )
        .setColor("DarkRed")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("Ban komutunda hata:", err);
      return interaction.reply({ content: "❌ Kullanıcıyı yasaklayamadım. Yetkim veya sıralamam yetersiz olabilir.", ephemeral: true });
    }
  }
};
