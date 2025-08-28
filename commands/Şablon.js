const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kurulum")
    .setDescription("Askeri sunucu şablonunu kurar (mevcut her şeyi siler!)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();

    await interaction.reply({ content: "🚨 Kurulum başlatılıyor... Tüm eski roller ve kanallar silinecek.", ephemeral: true });

    // 1. Tüm kanalları sil
    for (const [id, channel] of guild.channels.cache) {
      await channel.delete().catch(() => {});
    }

    // 2. Tüm rolleri sil (botun rolünden yukarıdakiler hariç)
    for (const [id, role] of guild.roles.cache) {
      if (role.managed || role.id === guild.id) continue;
      if (role.position >= guild.members.me.roles.highest.position) continue;
      await role.delete().catch(() => {});
    }

    // ROLLERİ OLUŞTUR
    const roles = {};
    const roleList = [
      // Üst Komuta
      "Genelkurmay Başkanı",
      "Kuvvet Komutanı (Kara)",
      "Kuvvet Komutanı (Deniz)",
      "Kuvvet Komutanı (Hava)",
      "Kuvvet Komutanı (Jandarma)",
      "Tümgeneral",
      "Tuğgeneral",
      // Orta Kademe
      "Albay",
      "Yarbay",
      "Binbaşı",
      "Yüzbaşı",
      "Üsteğmen",
      "Teğmen",
      // Astsubay
      "Kıdemli Başçavuş",
      "Başçavuş",
      "Kıdemli Çavuş",
      "Çavuş",
      "Onbaşı",
      // Er
      "Er",
      "Acemi Er",
      "Askeri Öğrenci",
      // Özel
      "İstihbarat Subayı",
      "Özel Kuvvetler Operatörü",
      "İnzibat",
      "Pilot",
      "Denizci",
      // Destek
      "Doktor",
      "Mühendis",
      "Sivil Personel",
      "Misafir"
    ];

    for (const name of roleList) {
      const role = await guild.roles.create({ name, reason: "Askeri kurulum" });
      roles[name] = role;
    }

    // KANALLARI OLUŞTUR
    const categories = {};

    // Yönetim
    categories.yonetim = await guild.channels.create({
      name: "Yönetim",
      type: ChannelType.GuildCategory
    });
    await guild.channels.create({ name: "duyurular", type: ChannelType.GuildText, parent: categories.yonetim.id });
    await guild.channels.create({ name: "kurallar", type: ChannelType.GuildText, parent: categories.yonetim.id });
    await guild.channels.create({ name: "emirler", type: ChannelType.GuildText, parent: categories.yonetim.id });

    // Askeri Bilgilendirme
    categories.bilgi = await guild.channels.create({
      name: "Askeri Bilgilendirme",
      type: ChannelType.GuildCategory
    });
    await guild.channels.create({ name: "rütbeler", type: ChannelType.GuildText, parent: categories.bilgi.id });
    await guild.channels.create({ name: "eğitim-notları", type: ChannelType.GuildText, parent: categories.bilgi.id });
    await guild.channels.create({ name: "arşiv", type: ChannelType.GuildText, parent: categories.bilgi.id });

    // Branşlar
    categories.brans = await guild.channels.create({
      name: "Branşlar",
      type: ChannelType.GuildCategory
    });
    const bransKanallari = ["kara-kuvvetleri", "deniz-kuvvetleri", "hava-kuvvetleri", "jandarma", "özel-kuvvetler", "istihbarat"];
    for (const b of bransKanallari) {
      await guild.channels.create({ name: b, type: ChannelType.GuildText, parent: categories.brans.id });
    }

    // Eğitim
    categories.egitim = await guild.channels.create({
      name: "Eğitim",
      type: ChannelType.GuildCategory
    });
    const egitimKanallari = ["acemi-egitim", "taktik-dersleri", "silah-bilgisi", "harita-ve-strateji"];
    for (const e of egitimKanallari) {
      await guild.channels.create({ name: e, type: ChannelType.GuildText, parent: categories.egitim.id });
    }

    // Disiplin
    categories.disiplin = await guild.channels.create({
      name: "Disiplin",
      type: ChannelType.GuildCategory
    });
    const disiplinKanallari = ["yoklama", "disiplin-kaydi", "ceza-duyurulari", "raporlar"];
    for (const d of disiplinKanallari) {
      await guild.channels.create({ name: d, type: ChannelType.GuildText, parent: categories.disiplin.id });
    }

    // Sosyal
    categories.sosyal = await guild.channels.create({
      name: "Sosyal Alan",
      type: ChannelType.GuildCategory
    });
    const sosyalKanallari = ["sohbet", "kantin", "izinli-sohbet", "oyun"];
    for (const s of sosyalKanallari) {
      await guild.channels.create({ name: s, type: ChannelType.GuildText, parent: categories.sosyal.id });
    }

    // Ses kanalları
    categories.ses = await guild.channels.create({
      name: "Sesli Alan",
      type: ChannelType.GuildCategory
    });
    const sesKanallari = ["Komuta Merkezi", "Kara Kuvvetleri", "Deniz Kuvvetleri", "Hava Kuvvetleri", "Jandarma", "Özel Kuvvetler", "Eğitim Alanı", "Sosyal Ses"];
    for (const ses of sesKanallari) {
      await guild.channels.create({ name: ses, type: ChannelType.GuildVoice, parent: categories.ses.id });
    }

    // DM Rapor
    const embed = new EmbedBuilder()
      .setTitle("✅ Askeri Sunucu Kurulumu Tamamlandı")
      .setDescription("Tüm roller ve kanallar başarıyla oluşturuldu.")
      .setColor("DarkRed")
      .setTimestamp();

    owner.send({ embeds: [embed] }).catch(() => {});

    await interaction.editReply("✅ Kurulum tamamlandı. Sunucu sahibi DM üzerinden bilgilendirildi.");
  }
};
