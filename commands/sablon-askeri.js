const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("askeri-sablon")
    .setDescription("Askeri Discord şablonunu kurar."),
  async execute(interaction) {
    await interaction.reply("🪖 Askeri şablon kuruluyor, lütfen bekleyin...");

    const guild = interaction.guild;

    // 📌 1. TÜM ROLLER
    const rankNames = [
      "Genelkurmay Başkanı",
      "Mareşal",
      "Orgeneral / Oramiral",
      "Korgeneral / Koramiral",
      "Tümgeneral / Tümamiral",
      "Tuğgeneral / Tuğamiral",
      "Albay",
      "Yarbay",
      "Binbaşı",
      "Yüzbaşı",
      "Üsteğmen",
      "Teğmen",
      "Astsubay Kıdemli Başçavuş",
      "Astsubay Kıdemli Çavuş",
      "Astsubay Çavuş",
      "Uzman Çavuş",
      "Çavuş",
      "Onbaşı",
      "Er",
      "Sivil / Misafir"
    ];

    let roles = {};
    for (const name of rankNames) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({ name, permissions: [] });
      }
      roles[name] = role;
    }

    // 📌 2. KATEGORİ & KANALLAR
    async function createCategory(name) {
      return await guild.channels.create({
        name,
        type: 4, // category
      });
    }

    async function createChannel(name, parent, overwrites) {
      return await guild.channels.create({
        name,
        type: 0, // text
        parent: parent.id,
        permissionOverwrites: overwrites,
      });
    }

    // 🔹 KOMUTA MERKEZİ
    const komutaCat = await createCategory("📌 Komuta Merkezi");
    await createChannel("komuta-emirleri", komutaCat, [
      { id: guild.roles.everyone, deny: ["ViewChannel"] },
      { id: roles["Mareşal"].id, allow: ["ViewChannel", "SendMessages"] },
      { id: roles["Orgeneral / Oramiral"].id, allow: ["ViewChannel", "SendMessages"] },
      { id: roles["Albay"].id, allow: ["ViewChannel"], deny: ["SendMessages"] },
    ]);

    await createChannel("raporlar", komutaCat, [
      { id: guild.roles.everyone, deny: ["ViewChannel"] },
      { id: roles["Subay"].id, allow: ["ViewChannel", "SendMessages"] },
      { id: roles["Astsubay Çavuş"].id, allow: ["ViewChannel"], deny: ["SendMessages"] },
    ]);

    await createChannel("duyurular", komutaCat, [
      { id: guild.roles.everyone, allow: ["ViewChannel"], deny: ["SendMessages"] },
      { id: roles["Genelkurmay Başkanı"].id, allow: ["SendMessages"] },
    ]);

    // 🔹 OPERASYON
    const opCat = await createCategory("⚔️ Operasyon");
    await createChannel("harekat-planı", opCat, [
      { id: guild.roles.everyone, deny: ["ViewChannel"] },
      { id: roles["Orgeneral / Oramiral"].id, allow: ["ViewChannel", "SendMessages"] },
      { id: roles["Albay"].id, allow: ["ViewChannel", "SendMessages"] },
    ]);
    await createChannel("görev-takibi", opCat, [
      { id: guild.roles.everyone, deny: ["ViewChannel"] },
      { id: roles["Subay"].id, allow: ["ViewChannel", "SendMessages"] },
      { id: roles["Er"].id, allow: ["ViewChannel"], deny: ["SendMessages"] },
    ]);

    // 🔹 EĞİTİM
    const egitimCat = await createCategory("🎓 Eğitim");
    await createChannel("temel-eğitim", egitimCat, [
      { id: guild.roles.everyone, allow: ["ViewChannel", "SendMessages"] },
    ]);
    await createChannel("ileri-eğitim", egitimCat, [
      { id: guild.roles.everyone, allow: ["ViewChannel"], deny: ["SendMessages"] },
      { id: roles["Subay"].id, allow: ["SendMessages"] },
    ]);

    // 🔹 LOJİSTİK
    const lojCat = await createCategory("🛡️ Lojistik");
    await createChannel("silah-depo", lojCat, [
      { id: guild.roles.everyone, deny: ["ViewChannel"] },
      { id: roles["Astsubay Çavuş"].id, allow: ["ViewChannel", "SendMessages"] },
      { id: roles["Subay"].id, allow: ["ViewChannel", "SendMessages"] },
    ]);

    // 🔹 SOSYAL
    const sosyalCat = await createCategory("💬 Sosyal");
    await createChannel("sohbet", sosyalCat, [
      { id: guild.roles.everyone, allow: ["ViewChannel", "SendMessages"] },
    ]);
    await createChannel("müzik", sosyalCat, [
      { id: guild.roles.everyone, allow: ["ViewChannel", "SendMessages"] },
    ]);

    await interaction.editReply("✅ Askeri şablon başarıyla kuruldu!");
  },
};
