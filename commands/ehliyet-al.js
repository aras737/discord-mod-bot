const { SlashCommandBuilder } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-al")
    .setDescription("Kendi adına ehliyet alırsın."),

  async execute(interaction) {
    const userId = interaction.user.id;

    const ehliyet = db.get(`ehliyet_${userId}`);
    if (ehliyet) {
      return interaction.reply({ content: "❌ Zaten ehliyetin var!", ephemeral: true });
    }

    db.set(`ehliyet_${userId}`, { durum: "Var", tarih: new Date().toLocaleString("tr-TR") });

    return interaction.reply(`✅ Ehliyet başarıyla alındı! 🚗💨`);
  }
};
