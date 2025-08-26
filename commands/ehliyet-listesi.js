const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-liste")
    .setDescription("Ehliyeti olan kullanıcıları listeler."),

  async execute(interaction) {
    const all = db.all().filter(entry => entry.ID.startsWith("ehliyet_"));
    if (all.length === 0) {
      return interaction.reply("❌ Hiç kimsede ehliyet yok.");
    }

    const list = all.map(entry => {
      const userId = entry.ID.split("_")[1];
      const user = interaction.guild.members.cache.get(userId);
      return user ? `${user} (${entry.data.tarih})` : `❓ ${userId}`;
    }).join("\n");

    const embed = new EmbedBuilder()
      .setTitle("🚦 Ehliyet Listesi")
      .setDescription(list)
      .setColor("Blue");

    return interaction.reply({ embeds: [embed] });
  }
};
