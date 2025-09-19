const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir kullanıcıyı kalıcı olarak yasaklar.")
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Yasaklanacak kullanıcıyı seçiniz.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sebep")
        .setDescription("Yasaklama sebebini belirtiniz.")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanıcı");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi.";

    try {
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: "Belirtilen kullanıcı sunucuda bulunamadı.", ephemeral: true });
      }

      if (!member.bannable) {
        return interaction.reply({ content: "Bu kullanıcıyı yasaklamak için yetkim yetersiz. Rol sıralamasını kontrol ediniz.", ephemeral: true });
      }

      await user.send(
        `${interaction.guild.name} sunucusundan kalıcı olarak yasaklandınız.\nSebep: ${reason}`
      ).catch(() => {});

      await member.ban({ reason });

      const entry = {
        id: user.id,
        tag: user.tag,
        reason,
        by: interaction.user.tag,
        date: new Date().toLocaleString("tr-TR")
      };

      let banlist = await db.get(`banlist_${interaction.guild.id}`);
      if (!Array.isArray(banlist)) banlist = [];
      banlist.push(entry);
      await db.set(`banlist_${interaction.guild.id}`, banlist);

      const embed = new EmbedBuilder()
        .setTitle("Kalıcı Yasaklama")
        .setDescription("Bir kullanıcı sunucudan süresiz olarak yasaklanmıştır.")
        .addFields(
          { name: "Yasaklanan Kullanıcı", value: `${user.tag} (${user.id})` },
          { name: "Sebep", value: reason },
          { name: "Yasaklayan Yetkili", value: interaction.user.tag },
          { name: "Tarih", value: entry.date }
        )
        .setColor("DarkRed")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("Ban komutunda hata:", err);
      return interaction.reply({ content: "Kullanıcıyı yasaklarken bir hata meydana geldi.", ephemeral: true });
    }
  }
};
