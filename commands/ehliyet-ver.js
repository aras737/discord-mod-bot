const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sablon-askeri")
    .setDescription("🪖 Ultra detaylı askeri rolplay sunucusu şablonu kurar")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply("🛠️ Ultra detaylı askeri RP şablonu kuruluyor...");

    const guild = interaction.guild;

    try {
      // ========== 📌 ROLLER ==========
      const roles = {};

      // Yönetim
      roles.genelKomutan = await guild.roles.create({ name: "👑 Genel Komutan", color: "DarkRed", permissions: [PermissionFlagsBits.Administrator] });
      roles.subay = await guild.roles.create({ name: "🎖️ Subay", color: "Red" });
      roles.astsubay = await guild.roles.create({ name: "🪖 Astsubay", color: "Orange" });
      roles.er = await guild.roles.create({ name: "⚔️ Er", color: "Green" });

      // Branşlar
      roles.kara = await guild.roles.create({ name: "🚛 Kara Kuvvetleri", color: "Olive" });
      roles.hava = await guild.roles.create({ name: "✈️ Hava Kuvvetleri", color: "Blue" });
      roles.deniz = await guild.roles.create({ name: "⚓ Deniz Kuvvetleri", color: "Navy" });
      roles.ozel = await guild.roles.create({ name: "🎯 Özel Kuvvetler", color: "Purple" });
      roles.istihbarat = await guild.roles.create({ name: "🕵️ İstihbarat", color: "Grey" });
      roles.saglik = await guild.roles.create({ name: "⛑️ Sağlık Birimi", color: "LightGrey" });
      roles.lojistik = await guild.roles.create({ name: "📦 Lojistik", color: "Brown" });
      roles.iletisim = await guild.roles.create({ name: "📡 İletişim Birimi", color: "Aqua" });

      // Diğer
      roles.sivil = await guild.roles.create({ name: "👥 Sivil", color: "Grey" });
      roles.misafir = await guild.roles.create({ name: "🎫 Misafir", color: "LightGrey" });

      // ========== 📌 KATEGORİLER & KANALLAR ==========
      // Genel Yönetim
      const genelyonetim = await guild.channels.create({ name: "📂 Genel Yönetim", type: 4 });
      await guild.channels.create({ name: "📢・duyurular", type: 0, parent: genelyonetim.id });
      await guild.channels.create({ name: "📜・kurallar", type: 0, parent: genelyonetim.id });
      await guild.channels.create({ name: "💬・sohbet", type: 0, parent: genelyonetim.id });
      await guild.channels.create({ name: "🤖・bot-komut", type: 0, parent: genelyonetim.id });

      // Askeri Yönetim
      const askeri = await guild.channels.create({ name: "🪖 Askeri Yönetim", type: 4 });
      await guild.channels.create({ name: "📋・emirler", type: 0, parent: askeri.id });
      await guild.channels.create({ name: "🧾・günlük-raporlar", type: 0, parent: askeri.id });
      await guild.channels.create({ name: "🧭・devriyeler", type: 0, parent: askeri.id });
      await guild.channels.create({ name: "🎯・tatbikat", type: 0, parent: askeri.id });
      await guild.channels.create({ name: "🏛️・brifing-odasi", type: 0, parent: askeri.id });
      await guild.channels.create({ name: "⚖️・disiplin-mahkemesi", type: 0, parent: askeri.id });

      // Branş Kategorileri
      const kara = await guild.channels.create({ name: "🚛 Kara Kuvvetleri", type: 4 });
      await guild.channels.create({ name: "📌・kara-genel", type: 0, parent: kara.id });
      await guild.channels.create({ name: "🚓・devriye-plani", type: 0, parent: kara.id });
      await guild.channels.create({ name: "🔫・cephanelik", type: 0, parent: kara.id });

      const hava = await guild.channels.create({ name: "✈️ Hava Kuvvetleri", type: 4 });
      await guild.channels.create({ name: "📌・hava-genel", type: 0, parent: hava.id });
      await guild.channels.create({ name: "🛫・ucus-plani", type: 0, parent: hava.id });
      await guild.channels.create({ name: "💥・hava-operasyon", type: 0, parent: hava.id });

      const deniz = await guild.channels.create({ name: "⚓ Deniz Kuvvetleri", type: 4 });
      await guild.channels.create({ name: "📌・deniz-genel", type: 0, parent: deniz.id });
      await guild.channels.create({ name: "🚤・devriye-deniz", type: 0, parent: deniz.id });
      await guild.channels.create({ name: "⚔️・deniz-operasyon", type: 0, parent: deniz.id });

      const ozel = await guild.channels.create({ name: "🎯 Özel Kuvvetler", type: 4 });
      await guild.channels.create({ name: "📌・ozel-genel", type: 0, parent: ozel.id });
      await guild.channels.create({ name: "🕵️・gizli-gorevler", type: 0, parent: ozel.id });
      await guild.channels.create({ name: "💣・operasyon-hazirlik", type: 0, parent: ozel.id });

      // Destek Birimleri
      const destek = await guild.channels.create({ name: "⚕️ Destek Birimleri", type: 4 });
      await guild.channels.create({ name: "⛑️・saglik-merkezi", type: 0, parent: destek.id });
      await guild.channels.create({ name: "📦・lojistik-rapor", type: 0, parent: destek.id });
      await guild.channels.create({ name: "📡・iletisim-agi", type: 0, parent: destek.id });

      // Operasyonlar
      const operasyon = await guild.channels.create({ name: "⚔️ Operasyonlar", type: 4 });
      await guild.channels.create({ name: "🗡️・operasyon-1", type: 2, parent: operasyon.id });
      await guild.channels.create({ name: "🗡️・operasyon-2", type: 2, parent: operasyon.id });
      await guild.channels.create({ name: "📞・harekat-masasi", type: 2, parent: operasyon.id });

      // Sosyal
      const sosyal = await guild.channels.create({ name: "🎉 Sosyal Alan", type: 4 });
      await guild.channels.create({ name: "🎶・müzik", type: 2, parent: sosyal.id });
      await guild.channels.create({ name: "🎮・oyun-arkadasi", type: 0, parent: sosyal.id });

      // ========== 📌 İlk Mesajlar ==========
      const rulesChannel = guild.channels.cache.find(c => c.name.includes("kurallar"));
      if (rulesChannel) {
        rulesChannel.send(`
📜 **SUNUCU KURALLARI**
1️⃣ Emir-komuta zinciri zorunludur.
2️⃣ Rütbeler hiyerarşiye göre kullanılır.
3️⃣ Spam, flood ve küfür yasaktır.
4️⃣ Gizli operasyon bilgilerini paylaşmak yasaktır.
5️⃣ Branşınıza uygun kanalları kullanın.
        `);
      }

      const duyuruChannel = guild.channels.cache.find(c => c.name.includes("duyurular"));
      if (duyuruChannel) {
        duyuruChannel.send("📢 **Hoş geldiniz!** Bu sunucu resmi askeri RP şablonu üzerine kurulmuştur. ⚔️");
      }

      await interaction.followUp("✅ Ultra detaylı askeri şablon başarıyla kuruldu!");

    } catch (err) {
      console.error(err);
      await interaction.followUp("❌ Şablon kurulurken bir hata oluştu.");
    }
  }
};
