const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-liste")
    .setDescription("Ehliyeti olan kullanıcıları listeler."),

  async execute(interaction) {
    const all = await db.all();
    const ehliyetliler = all.filter(entry => entry.id.startsWith("ehliyet_"));

    if (ehliyetliler.length === 0) {
      return interaction.reply("❌ Hiç kimsede ehliyet yok.");
    }

    // Listeyi düzenle
    const list = ehliyetliler.map(entry => {
      const userId = entry.id.split("_")[1];
      const member = interaction.guild.members.cache.get(userId);
      if (member) {
        return `👤 ${member} - 📅 ${entry.value.tarih}`;
      } else {
        return `❓ <@${userId}> (Sunucuda yok) - 📅 ${entry.value.tarih}`;
      }
    }).join("\n");

    // Embed
    const embed = new EmbedBuilder()
      .setTitle("🚦 Ehliyet Listesi")
      .setDescription(list.length > 4000 ? list.slice(0, 4000) + "\n... (daha fazla var)" : list)
      .setColor("Blue")
      .setFooter({ text: `Toplam ${ehliyetliler.length} kişi` });

    return interaction.reply({ embeds: [embed] });
  }
};
