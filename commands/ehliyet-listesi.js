const { SlashCommandBuilder } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-listesi")
    .setDescription("Sunucuda ehliyeti olanların listesini görüntüle."),

  async execute(interaction) {
    const all = db.all().filter(entry => entry.ID.startsWith("ehliyet_"));

    if (all.length === 0) {
      return interaction.reply("📭 Bu sunucuda hiç kimsenin ehliyeti yok.");
    }

    const list = all.map(entry => {
      const userId = entry.ID.split("_")[1];
      const data = entry.data;
      return `👤 <@${userId}> — 📅 ${data.tarih}`;
    });

    await interaction.reply(`🪪 **Ehliyet Sahipleri:**\n${list.join("\n")}`);
  }
};
