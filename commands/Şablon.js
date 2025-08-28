const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kurulum")
    .setDescription("Askeri sunucu şablonu kurar")
    .addStringOption(option =>
      option
        .setName("brans")
        .setDescription("Kurulacak branşı seç")
        .setRequired(true)
        .addChoices(
          { name: "Kara Kuvvetleri", value: "kara" },
          { name: "Deniz Kuvvetleri", value: "deniz" },
          { name: "Hava Kuvvetleri", value: "hava" },
          { name: "Jandarma", value: "jandarma" },
          { name: "Özel Kuvvetler", value: "ozel" },
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const brans = interaction.options.getString("brans");

    // 🔴 Tüm eski roller ve kanalları sil
    await interaction.reply({ content: "🛠️ Kurulum başlatıldı, mevcut roller ve kanallar temizleniyor...", ephemeral: true });

    for (const role of guild.roles.cache.filter(r => r.id !== guild.id).values()) {
      await role.delete().catch(() => {});
    }
    for (const channel of guild.channels.cache.values()) {
      await channel.delete().catch(() => {});
    }

    // Branşlara göre roller
    let roller = [];

    if (brans === "kara") {
      roller = [
        "Mareşal","Orgeneral","Korgeneral","Tümgeneral","Tuğgeneral",
        "Albay","Yarbay","Binbaşı","Yüzbaşı","Üsteğmen","Teğmen","Asteğmen",
        "Astsubay Kıdemli Başçavuş","Astsubay Başçavuş","Astsubay Kıdemli Çavuş",
        "Astsubay Çavuş","Uzman Çavuş","Uzman Onbaşı","Sözleşmeli Er",
        "Er","Acemi Er","Yedek Subay Adayı"
      ];
    } else if (brans === "deniz") {
      roller = [
        "Büyükamiral","Oramiral","Koramiral","Tümamiral","Tuğamiral",
        "Albay","Yarbay","Binbaşı","Yüzbaşı (Kaptan)","Üsteğmen","Teğmen",
        "Astsubay Başçavuş","Astsubay Çavuş",
        "Deniz Er","Acemi Deniz Er"
      ];
    } else if (brans === "hava") {
      roller = [
        "Orgeneral","Korgeneral","Tümgeneral","Tuğgeneral",
        "Hava Pilot Albay","Hava Pilot Yarbay","Hava Pilot Binbaşı","Hava Pilot Yüzbaşı",
        "Pilot Üsteğmen","Pilot Teğmen","Astsubay","Hava Er","Yedek Subay Adayı"
      ];
    } else if (brans === "jandarma") {
      roller = [
        "Jandarma Orgeneral","Jandarma Korgeneral","Jandarma Tümgeneral","Jandarma Tuğgeneral",
        "Jandarma Albay","Jandarma Yarbay","Jandarma Binbaşı","Jandarma Yüzbaşı",
        "Jandarma Üsteğmen","Jandarma Teğmen","Jandarma Astsubay",
        "Jandarma Uzman Çavuş","Jandarma Uzman Onbaşı","Jandarma Erbaş","Jandarma Er"
      ];
    } else if (brans === "ozel") {
      roller = [
        "Özel Kuvvetler Komutanı","Operasyon Timi Lideri","Kıdemli Operatör",
        "Operatör","İstihbarat Görevlisi","Ajan","Gizli Ajan"
      ];
    }

    // Roller oluştur
    const createdRoles = [];
    for (const r of roller) {
      const role = await guild.roles.create({ name: r, reason: `Kurulum: ${brans}` }).catch(() => null);
      if (role) createdRoles.push(role.name);
    }

    // Kategoriler ve kanallar
    const kategori = await guild.channels.create({
      name: "Genel",
      type: 4, // Category
    });

    await guild.channels.create({
      name: "genel-sohbet",
      type: 0,
      parent: kategori.id
    });

    await guild.channels.create({
      name: "duyurular",
      type: 0,
      parent: kategori.id
    });

    await guild.channels.create({
      name: "emir-komuta",
      type: 0,
      parent: kategori.id
    });

    // 📩 DM üzerinden rapor
    const embed = new EmbedBuilder()
      .setTitle("✅ Kurulum Tamamlandı")
      .setDescription(`Sunucu için **${brans.toUpperCase()}** şablonu kuruldu.`)
      .addFields(
        { name: "Oluşturulan Roller", value: createdRoles.join(", ") || "Yok" },
        { name: "Kanallar", value: "genel-sohbet, duyurular, emir-komuta" }
      )
      .setColor("DarkRed");

    await interaction.user.send({ embeds: [embed] }).catch(() => {
      interaction.followUp({ content: "⚠️ DM gönderilemedi, şablon tamamlandı.", ephemeral: true });
    });

    await interaction.followUp({ content: "✅ Kurulum başarıyla tamamlandı!", ephemeral: true });
  }
};
