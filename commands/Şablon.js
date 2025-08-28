const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Sunucuyu sıfırlar ve seçilen şablonu kurar.")
    .addStringOption(option =>
      option.setName("şablon")
        .setDescription("Kurulacak şablonu seç")
        .setRequired(true)
        .addChoices(
          { name: "Askeri Genel", value: "genel" },
          { name: "Kara Kuvvetleri", value: "kara" },
          { name: "Hava Kuvvetleri", value: "hava" },
          { name: "Deniz Kuvvetleri", value: "deniz" },
          { name: "İnzibat", value: "inzibat" },
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const seçilen = interaction.options.getString("şablon");

    await interaction.reply({ content: `⚠️ ${seçilen} şablonu kuruluyor...`, ephemeral: true });

    // 1️⃣ Tüm kanalları sil
    await Promise.all(guild.channels.cache.map(ch => ch.delete().catch(() => null)));

    // 2️⃣ Tüm rolleri sil (@everyone hariç)
    await Promise.all(guild.roles.cache
      .filter(r => r.name !== "@everyone")
      .map(r => r.delete().catch(() => null)));

    // 3️⃣ ŞABLONLAR
    const şablonlar = {
      "genel": {
        roller: [
          "Mareşal", "Orgeneral", "Korgeneral", "Tümgeneral", "Tuğgeneral",
          "Albay", "Yarbay", "Binbaşı", "Yüzbaşı", "Üsteğmen", "Teğmen",
          "Kıdemli Başçavuş", "Başçavuş", "Kıdemli Üstçavuş", "Üstçavuş", "Kıdemli Çavuş", "Çavuş",
          "Onbaşı", "Er",
          "Uzman Çavuş", "Uzman Onbaşı",
          "Kara Kuvvetleri", "Deniz Kuvvetleri", "Hava Kuvvetleri", "Özel Kuvvetler"
        ],
        kategoriler: {
          "DUYURULAR": ["kurallar", "duyurular", "operasyonlar"],
          "GENEL": ["sohbet", "medya", "komutlar"],
          "ASKERİ BİLGİ": ["emir-komut", "eğitim-notları", "rütbe-dokümanları"],
          "SES KANALLARI": ["Genel Sohbet", "Eğitim Alanı", "Komuta Merkezi"],
          "KAYIT & BAŞVURU": ["başvurular", "başvuru-log"],
          "LOG & YÖNETİM": ["ticket-log", "disiplin-kayıt", "sunucu-log"]
        }
      },
      "kara": {
        roller: ["Kara Kuvvetleri Komutanı", "Tugay Komutanı", "Tabur Komutanı", "Bölük Komutanı", "Takım Komutanı", "Çavuş", "Onbaşı", "Er"],
        kategoriler: {
          "KARA KUVVETLERİ": ["tugay-emirleri", "tabur-duyurular", "bölük-emirleri"],
          "OPERASYONLAR": ["harekat-planları", "eğitim-alanları"],
          "SES": ["Kara Kuvvetleri Sohbet", "Operasyon Kanalı"]
        }
      },
      "hava": {
        roller: ["Hava Kuvvetleri Komutanı", "Pilot", "Yer Ekibi", "Teknisyen"],
        kategoriler: {
          "HAVA KUVVETLERİ": ["uçuş-duyuruları", "hava-operasyonları", "pilot-raporları"],
          "SES": ["Kule İletişimi", "Pilotlar", "Eğitim Uçuşu"]
        }
      },
      "deniz": {
        roller: ["Deniz Kuvvetleri Komutanı", "Amiral", "Kaptan", "Denizci", "Teknisyen"],
        kategoriler: {
          "DENİZ KUVVETLERİ": ["filo-emirleri", "gemi-duyuruları"],
          "SES": ["Filo Kanalı", "Kaptan Köşkü"]
        }
      },
      "inzibat": {
        roller: ["İnzibat Komutanı", "Devriye Subayı", "İnzibat Er", "Tutuklu"],
        kategoriler: {
          "İNZİBAT": ["devriye-kayıtları", "disiplin-raporları"],
          "SES": ["Devriye Kanalı", "Karargah"]
        }
      }
    };

    const seçiliŞablon = şablonlar[seçilen];
    if (!seçiliŞablon) return interaction.followUp("❌ Geçersiz şablon seçildi!");

    // Roller oluştur
    for (const roleName of seçiliŞablon.roller) {
      await guild.roles.create({ name: roleName, reason: "Askeri şablon kurulumu" });
    }

    // Kategoriler & kanallar oluştur
    for (const [kat, chans] of Object.entries(seçiliŞablon.kategoriler)) {
      const kategori = await guild.channels.create({ name: kat, type: ChannelType.GuildCategory });
      for (const chName of chans) {
        await guild.channels.create({ name: chName, type: ChannelType.GuildText, parent: kategori.id });
      }
    }

    await interaction.followUp(`✅ ${seçilen} şablonu başarıyla kuruldu!`);
  },
};
