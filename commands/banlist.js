const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banlist")
    .setDescription("Sunucudaki tüm yasaklı kullanıcıları gösterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const banlist = await db.get(`banlist_${interaction.guild.id}`) || [];

    if (banlist.length === 0) {
      return interaction.reply({ content: "Sunucuda yasaklı kullanıcı bulunmuyor.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("Ban Listesi")
      .setColor("DarkBlue")
      .setTimestamp();

    banlist.forEach(entry => {
      embed.addFields({
        name: entry.tag,
        value: `ID: ${entry.id}\nSebep: ${entry.reason}\nYetkili: ${entry.by}\nTarih: ${entry.date}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
