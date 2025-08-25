const { SlashCommandBuilder } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-listesi")
    .setDescription("Sunucudaki ehliyet sahiplerini gösterir."),

  async execute(interaction, client) {
    let all = db.all().filter(data => data.ID.startsWith("ehliyet_"));
    if (all.length < 1) return interaction.reply("📭 Ehliyet sahibi yok!");

    let list = all.map((x, i) => {
      let id = x.ID.split("_")[1];
      let u = client.users.cache.get(id);
      return `**${i+1}.** ${u ? u.tag : id} | Durum: ${x.data.durum} | Ceza: ${x.data.ceza}`;
    }).join("\n");

    await interaction.reply("📋 **Ehliyet Listesi:**\n" + list);
  }
};
