const { SlashCommandBuilder } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-al")
    .setDescription("Kendine ehliyet al."),

  async execute(interaction) {
    if (db.get(`ehliyet_${interaction.user.id}`)) {
      return interaction.reply({ content: "📛 Zaten ehliyetin var!", ephemeral: true });
    }

    db.set(`ehliyet_${interaction.user.id}`, { durum: "Aktif", ceza: 0 });
    await interaction.reply("✅ Ehliyetin başarıyla alındı! Güvenli sürüşler 🚗💨");
  }
};
