const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-liste")
    .setDescription("Sunucudaki ehliyet sahiplerini listeler veya arama yapar.")
    .addStringOption(option =>
      option
        .setName("arama")
        .setDescription("Aramak istediğin Roblox ismi veya Discord kullanıcısı")
        .setRequired(false)
    ),

  async execute(interaction) {
    const search = interaction.options.getString("arama");

    // Tüm ehliyetleri çek
    const all = await db.all();
    const ehliyetler = all.filter(e => e.id.startsWith("ehliyet_"));

    if (!ehliyetler.length) {
      return interaction.reply({ content: "❌ Hiç kimsenin ehliyeti yok.", flags: 64 });
    }

    // 🔎 Arama yapıldıysa filtrele
    let filtered = ehliyetler;
    if (search) {
      filtered = ehliyetler.filter(e => {
        const data = e.value;
        return (
          data.roblox?.toLowerCase().includes(search.toLowerCase()) ||
          interaction.client.users.cache.get(e.id.replace("ehliyet_", ""))
            ?.username.toLowerCase()
            .includes(search.toLowerCase())
        );
      });

      if (!filtered.length) {
        return interaction.reply({ content: `❌ "${search}" için ehliyet bulunamadı.`, flags: 64 });
      }
    }

    // Embed hazırlanıyor
    const embed = new EmbedBuilder()
      .setTitle("🚗 Ehliyet Listesi")
      .setColor("Blue")
      .setDescription(
        filtered
          .map((e, i) => {
            const uid = e.id.replace("ehliyet_", "");
            const data = e.value;
            const roblox = data.roblox || "Belirtilmemiş";
            const durum = data.durum || "Bilinmiyor";
            return `**${i + 1}.** <@${uid}> | Roblox: \`${roblox}\` | 📌 ${durum}`;
          })
          .slice(0, 15) // çok uzun olursa ilk 15 kişiyi göster
          .join("\n")
      )
      .setFooter({
        text: search ? `"${search}" için sonuçlar` : `Toplam ${ehliyetler.length} ehliyet sahibi`
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
