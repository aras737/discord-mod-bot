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

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "Bu kullanıcı sunucuda bulunamadı.", ephemeral: true });

    if (!member.bannable) return interaction.reply({ content: "Bu kullanıcıyı yasaklayamıyorum.", ephemeral: true });

    try {
      await member.send(`Kalıcı olarak yasaklandınız. Sebep: ${reason}`).catch(() => {});
      await member.ban({ reason });

      // 📌 Banlist veritabanına ekle
      await db.push(`banlist_${interaction.guild.id}`, {
        id: target.id,
        tag: target.tag,
        reason,
        by: interaction.user.tag,
        date: new Date().toLocaleString("tr-TR")
      });

      const embed = new EmbedBuilder()
        .setTitle("Kalıcı Yasaklama")
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
      console.error(err);
      await interaction.reply({ content: "Yasaklama başarısız oldu.", ephemeral: true });
    }
  }
};
