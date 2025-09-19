const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Bir kullanıcının yasağını kaldırır.")
    .addStringOption(option =>
      option.setName("id")
        .setDescription("Yasağı kaldırılacak kullanıcının ID'si")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString("id");

    try {
      await interaction.guild.bans.remove(userId);

      // 📌 Banlist’ten sil
      let banlist = await db.get(`banlist_${interaction.guild.id}`) || [];
      banlist = banlist.filter(entry => entry.id !== userId);
      await db.set(`banlist_${interaction.guild.id}`, banlist);

      const embed = new EmbedBuilder()
        .setTitle("Yasaklama Kaldırıldı")
        .setDescription(`Kullanıcı ID: ${userId}\nYasağı kaldırıldı.`)
        .setColor("Green")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: "Yasak kaldırılırken hata oluştu.", ephemeral: true });
    }
  }
};
