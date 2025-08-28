const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-liste")
    .setDescription("Kayıtlı ehliyetleri gösterir.")
    .addUserOption(option =>
      option
        .setName("kullanici")
        .setDescription("Ehliyetini görmek istediğin kişi")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("kullanici");

    // Eğer belirli kullanıcı seçildiyse, direkt onun ehliyetini getir
    if (target) {
      const data = await db.get(`ehliyet_${target.id}`);
      if (!data) {
        return interaction.reply({
          content: `🚫 ${target} kullanıcısının kayıtlı ehliyeti yok.`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setAuthor({ name: "📋 Dijital Ehliyet Sorgulama" })
        .setTitle("🚔 Ehliyet Kaydı")
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "👤 Discord", value: `${target.tag}`, inline: true },
          { name: "🕹️ Roblox", value: `${data.roblox}`, inline: true },
          { name: "📌 Durum", value: `✅ ${data.durum}`, inline: true },
          { name: "📅 Veriliş Tarihi", value: data.tarih, inline: true }
        )
        .setFooter({ text: "Dijital Ehliyet Sistemi - Resmi Kayıt" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // Eğer kullanıcı seçilmediyse, tüm listeyi çek
    const all = await db.all();
    const ehliyetler = all.filter(x => x.id.startsWith("ehliyet_"));

    if (ehliyetler.length === 0) {
      return interaction.reply({
        content: "🚫 Hiç kayıtlı ehliyet bulunamadı.",
        ephemeral: true
      });
    }

    // Listeyi embed şeklinde yap
    const embed = new EmbedBuilder()
      .setColor("#2c3e50")
      .setTitle("📋 Dijital Ehliyet Listesi")
      .setDescription("Aşağıda kayıtlı tüm ehliyetler listelenmiştir.\n\n⚠️ **Aranan isim bulunamıyorsa, kayıt yapılmamıştır.**")
      .setFooter({ text: "Resmi Kayıt Sistemi" })
      .setTimestamp();

    let i = 1;
    for (const ehliyet of ehliyetler) {
      const userId = ehliyet.id.replace("ehliyet_", "");
      const data = ehliyet.value;
      embed.addFields({
        name: `#${i} • ${data.roblox}`,
        value: `👤 <@${userId}> | 📅 ${data.tarih} | 📌 ${data.durum}`,
        inline: false
      });
      i++;
    }

    return interaction.reply({ embeds: [embed] });
  }
};
