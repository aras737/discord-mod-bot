const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("askeri-sunucu") // Komut adı benzersiz
    .setDescription("Askeri sunucu şablonunu kurar (kanallar ve roller)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;

    await interaction.reply("🪖 Askeri sunucu şablonu kuruluyor...");

    // Roller
    const roles = {};
    roles.komutan = await guild.roles.create({
      name: "👨‍✈️ Komutan",
      color: "Red",
      hoist: true,
    });
    roles.subay = await guild.roles.create({
      name: "🎖️ Subay",
      color: "Blue",
    });
    roles.er = await guild.roles.create({
      name: "🪖 Er",
      color: "Green",
    });
    roles.misafir = await guild.roles.create({
      name: "👥 Misafir",
      color: "Grey",
    });

    // Genel Kategorisi
    const genelKategori = await guild.channels.create({
      name: "📢 Genel Alan",
      type: 4, // CATEGORY
    });

    await guild.channels.create({
      name: "📜-kurallar",
      type: 0, // TEXT
      parent: genelKategori.id,
    });
    await guild.channels.create({
      name: "📢-duyurular",
      type: 0,
      parent: genelKategori.id,
    });
    await guild.channels.create({
      name: "💬-sohbet",
      type: 0,
      parent: genelKategori.id,
    });
    await guild.channels.create({
      name: "🎶-müzik",
      type: 2, // VOICE
      parent: genelKategori.id,
    });

    // Askeri Kategorisi
    const askeriKategori = await guild.channels.create({
      name: "🪖 Askeri Alan",
      type: 4,
    });

    await guild.channels.create({
      name: "📋-emir-komuta",
      type: 0,
      parent: askeriKategori.id,
    });
    await guild.channels.create({
      name: "📂-operasyon-plan",
      type: 0,
      parent: askeriKategori.id,
    });
    await guild.channels.create({
      name: "🎤-toplantı",
      type: 2,
      parent: askeriKategori.id,
    });
    await guild.channels.create({
      name: "🎮-tatbikat",
      type: 2,
      parent: askeriKategori.id,
    });

    await interaction.followUp("✅ Askeri sunucu şablonu başarıyla kuruldu!");
  },
};
