const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumar')
    .setDescription('Çeşitli kumar oyunları oynayın ve şansınızı deneyin')
    .addSubcommand(subcommand =>
      subcommand
        .setName('zar')
        .setDescription('Zar atarak kumar oynayın')
        .addIntegerOption(option =>
          option.setName('bahis')
            .setDescription('Bahis miktarını giriniz')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10000)
        )
        .addIntegerOption(option =>
          option.setName('tahmin')
            .setDescription('Zar sonucunu tahmin ediniz (1-6)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(6)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('slot')
        .setDescription('Slot makinesi oyunu oynayın')
        .addIntegerOption(option =>
          option.setName('bahis')
            .setDescription('Bahis miktarını giriniz')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5000)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('blackjack')
        .setDescription('Blackjack oyunu oynayın')
        .addIntegerOption(option =>
          option.setName('bahis')
            .setDescription('Bahis miktarını giriniz')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(2000)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rulet')
        .setDescription('Rulet oyunu oynayın')
        .addIntegerOption(option =>
          option.setName('bahis')
            .setDescription('Bahis miktarını giriniz')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(3000)
        )
        .addStringOption(option =>
          option.setName('secim')
            .setDescription('Bahis türünüzü seçiniz')
            .setRequired(true)
            .addChoices(
              { name: 'Kırmızı', value: 'kirmizi' },
              { name: 'Siyah', value: 'siyah' },
              { name: 'Çift Sayı', value: 'cift' },
              { name: 'Tek Sayı', value: 'tek' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('bakiye')
        .setDescription('Kumar bakiyenizi görüntüleyin')
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const altKomut = interaction.options.getSubcommand();

      switch (altKomut) {
        case 'zar':
          await this.zarOyunu(interaction);
          break;
        case 'slot':
          await this.slotOyunu(interaction);
          break;
        case 'blackjack':
          await this.blackjackOyunu(interaction);
          break;
        case 'rulet':
          await this.ruletOyunu(interaction);
          break;
        case 'bakiye':
          await this.bakiyeGoruntule(interaction);
          break;
        default:
          await interaction.editReply({
            content: 'Geçersiz oyun türü seçildi. Lütfen geçerli bir seçenek kullanınız.',
            ephemeral: true
          });
      }
    } catch (hata) {
      console.error('Kumar oyunu sırasında hata oluştu:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Oyun Hatası')
        .setDescription('Kumar oyunu oynanırken beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.')
        .setColor('#e74c3c')
        .addFields({
          name: 'Hata Detayı',
          value: hata.message || 'Bilinmeyen hata',
          inline: false
        })
        .setTimestamp()
        .setFooter({
          text: 'Kumar Oyun Sistemi'
        });

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  },

  async zarOyunu(interaction) {
    const bahisMiktari = interaction.options.getInteger('bahis');
    const kullaniciTahmini = interaction.options.getInteger('tahmin');
    const kullaniciId = interaction.user.id;

    // Kullanıcı bakiyesini kontrol et
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription('Belirtilen bahis miktarı için yeterli bakiyeniz bulunmamaktadır.')
        .setColor('#e74c3c')
        .addFields(
          {
            name: 'Mevcut Bakiyeniz',
            value: `${mevcutBakiye.toLocaleString('tr-TR')} coin`,
            inline: true
          },
          {
            name: 'Bahis Miktarı',
            value: `${bahisMiktari.toLocaleString('tr-TR')} coin`,
            inline: true
          },
          {
            name: 'Eksik Miktar',
            value: `${(bahisMiktari - mevcutBakiye).toLocaleString('tr-TR')} coin`,
            inline: true
          }
        )
        .setTimestamp();

      return await interaction.editReply({ embeds: [yetersizBakiyeEmbed] });
    }

    // Zar atılması
    const zarSonucu = Math.floor(Math.random() * 6) + 1;
    const kazandiMi = zarSonucu === kullaniciTahmini;
    const kazanilanMiktar = kazandiMi ? bahisMiktari * 5 : 0;
    const netKazanc = kazandiMi ? kazanilanMiktar - bahisMiktari : -bahisMiktari;

    // Bakiyeyi güncelle
    this.kullaniciBakiyesiniGuncelle(kullaniciId, netKazanc);
    const yeniBakiye = this.kullaniciBakiyesiniAl(kullaniciId);

    const zarEmbed = new EmbedBuilder()
      .setTitle('Zar Oyunu Sonucu')
      .setDescription(kazandiMi ? 'Tebrikler! Tahmininiz doğru çıktı.' : 'Maalesef tahmininiz yanlış çıktı.')
      .setColor(kazandiMi ? '#2ecc71' : '#e74c3c')
      .addFields(
        {
          name: 'Oyun Detayları',
          value: `**Tahmininiz:** ${kullaniciTahmini}\n**Zar Sonucu:** ${zarSonucu}\n**Bahis Miktarı:** ${bahisMiktari.toLocaleString('tr-TR')} coin`,
          inline: true
        },
        {
          name: 'Sonuç Bilgileri',
          value: `**Durum:** ${kazandiMi ? 'Kazandınız' : 'Kaybettiniz'}\n**Kazanılan:** ${kazanilanMiktar.toLocaleString('tr-TR')} coin\n**Net Kazanç:** ${netKazanc >= 0 ? '+' : ''}${netKazanc.toLocaleString('tr-TR')} coin`,
          inline: true
        },
        {
          name: 'Bakiye Bilgileri',
          value: `**Önceki Bakiye:** ${(yeniBakiye - netKazanc).toLocaleString('tr-TR')} coin\n**Güncel Bakiye:** ${yeniBakiye.toLocaleString('tr-TR')} coin`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Oyuncu: ${interaction.user.tag} • Zar Oyunu`,
        iconURL: interaction.user.displayAvatarURL()
      });

    // Tekrar oynama butonu
    const tekrarOynaButonu = new ButtonBuilder()
      .setCustomId(`zar_tekrar_${kullaniciId}`)
      .setLabel('Tekrar Oyna')
      .setStyle(ButtonStyle.Primary);

    const bakiyeButonu = new ButtonBuilder()
      .setCustomId(`bakiye_${kullaniciId}`)
      .setLabel('Bakiyemi Görüntüle')
      .setStyle(ButtonStyle.Secondary);

    const butonSatiri = new ActionRowBuilder()
      .addComponents(tekrarOynaButonu, bakiyeButonu);

    await interaction.editReply({
      embeds: [zarEmbed],
      components: [butonSatiri]
    });
  },

  async slotOyunu(interaction) {
    const bahisMiktari = interaction.options.getInteger('bahis');
    const kullaniciId = interaction.user.id;

    // Kullanıcı bakiyesini kontrol et
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription('Belirtilen bahis miktarı için yeterli bakiyeniz bulunmamaktadır.')
        .setColor('#e74c3c')
        .setTimestamp();

      return await interaction.editReply({ embeds: [yetersizBakiyeEmbed] });
    }

    // Slot sembolleri
    const semboller = ['Kiraz', 'Limon', 'Portakal', 'Üzüm', 'Yıldız', 'Elmas', 'Yedi'];
    const slot1 = semboller[Math.floor(Math.random() * semboller.length)];
    const slot2 = semboller[Math.floor(Math.random() * semboller.length)];
    const slot3 = semboller[Math.floor(Math.random() * semboller.length)];

    // Kazanç hesaplama
    let kazancKatsayisi = 0;
    let kazancAciklamasi = '';

    if (slot1 === slot2 && slot2 === slot3) {
      // Üç eşleşme
      if (slot1 === 'Elmas') {
        kazancKatsayisi = 50;
        kazancAciklamasi = 'Üç Elmas - Büyük İkramiye';
      } else if (slot1 === 'Yedi') {
        kazancKatsayisi = 25;
        kazancAciklamasi = 'Üç Yedi - Süper İkramiye';
      } else if (slot1 === 'Yıldız') {
        kazancKatsayisi = 15;
        kazancAciklamasi = 'Üç Yıldız - İkramiye';
      } else {
        kazancKatsayisi = 10;
        kazancAciklamasi = 'Üç Eşleşme';
      }
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      // İki eşleşme
      kazancKatsayisi = 2;
      kazancAciklamasi = 'İki Eşleşme';
    } else {
      // Eşleşme yok
      kazancKatsayisi = 0;
      kazancAciklamasi = 'Eşleşme Yok';
    }

    const kazanilanMiktar = bahisMiktari * kazancKatsayisi;
    const netKazanc = kazanilanMiktar - bahisMiktari;

    // Bakiyeyi güncelle
    this.kullaniciBakiyesiniGuncelle(kullaniciId, netKazanc);
    const yeniBakiye = this.kullaniciBakiyesiniAl(kullaniciId);

    const slotEmbed = new EmbedBuilder()
      .setTitle('Slot Makinesi Sonucu')
      .setDescription(`**${slot1} | ${slot2} | ${slot3}**`)
      .setColor(kazancKatsayisi > 0 ? '#2ecc71' : '#e74c3c')
      .addFields(
        {
          name: 'Oyun Sonucu',
          value: `**Sonuç:** ${kazancAciklamasi}\n**Kazanç Katsayısı:** x${kazancKatsayisi}\n**Bahis Miktarı:** ${bahisMiktari.toLocaleString('tr-TR')} coin`,
          inline: true
        },
        {
          name: 'Kazanç Bilgileri',
          value: `**Kazanılan:** ${kazanilanMiktar.toLocaleString('tr-TR')} coin\n**Net Kazanç:** ${netKazanc >= 0 ? '+' : ''}${netKazanc.toLocaleString('tr-TR')} coin\n**Güncel Bakiye:** ${yeniBakiye.toLocaleString('tr-TR')} coin`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Oyuncu: ${interaction.user.tag} • Slot Makinesi`,
        iconURL: interaction.user.displayAvatarURL()
      });

    await interaction.editReply({ embeds: [slotEmbed] });
  },

  async blackjackOyunu(interaction) {
    const bahisMiktari = interaction.options.getInteger('bahis');
    const kullaniciId = interaction.user.id;

    // Kullanıcı bakiyesini kontrol et
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription('Belirtilen bahis miktarı için yeterli bakiyeniz bulunmamaktadır.')
        .setColor('#e74c3c')
        .setTimestamp();

      return await interaction.editReply({ embeds: [yetersizBakiyeEmbed] });
    }

    // Kart değerleri
    const kartlar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]; // J, Q, K = 10
    
    // Oyuncu kartları
    const oyuncuKart1 = kartlar[Math.floor(Math.random() * kartlar.length)];
    const oyuncuKart2 = kartlar[Math.floor(Math.random() * kartlar.length)];
    let oyuncuToplam = oyuncuKart1 + oyuncuKart2;

    // As kontrolü (1 veya 11)
    if (oyuncuKart1 === 1 && oyuncuToplam + 10 <= 21) oyuncuToplam += 10;
    if (oyuncuKart2 === 1 && oyuncuToplam + 10 <= 21) oyuncuToplam += 10;

    // Krupiye kartları
    const krupiyeKart1 = kartlar[Math.floor(Math.random() * kartlar.length)];
    let krupiyeKart2 = kartlar[Math.floor(Math.random() * kartlar.length)];
    let krupiyeToplam = krupiyeKart1 + krupiyeKart2;

    // Krupiye as kontrolü
    if (krupiyeKart1 === 1 && krupiyeToplam + 10 <= 21) krupiyeToplam += 10;
    if (krupiyeKart2 === 1 && krupiyeToplam + 10 <= 21) krupiyeToplam += 10;

    // Krupiye 17'ye kadar kart çeker
    while (krupiyeToplam < 17) {
      const yeniKart = kartlar[Math.floor(Math.random() * kartlar.length)];
      krupiyeToplam += yeniKart;
      if (yeniKart === 1 && krupiyeToplam + 10 <= 21) krupiyeToplam += 10;
    }

    // Sonuç hesaplama
    let sonuc = '';
    let kazancKatsayisi = 0;

    if (oyuncuToplam > 21) {
      sonuc = 'Kaybettiniz - Kart toplamınız 21\'i aştı';
      kazancKatsayisi = 0;
    } else if (krupiyeToplam > 21) {
      sonuc = 'Kazandınız - Krupiye 21\'i aştı';
      kazancKatsayisi = 2;
    } else if (oyuncuToplam === 21 && krupiyeToplam !== 21) {
      sonuc = 'Blackjack - Kazandınız';
      kazancKatsayisi = 2.5;
    } else if (oyuncuToplam > krupiyeToplam) {
      sonuc = 'Kazandınız - Krupiyeden yüksek';
      kazancKatsayisi = 2;
    } else if (oyuncuToplam === krupiyeToplam) {
      sonuc = 'Berabere - Bahis iade edildi';
      kazancKatsayisi = 1;
    } else {
      sonuc = 'Kaybettiniz - Krupiye daha yüksek';
      kazancKatsayisi = 0;
    }

    const kazanilanMiktar = Math.floor(bahisMiktari * kazancKatsayisi);
    const netKazanc = kazanilanMiktar - bahisMiktari;

    // Bakiyeyi güncelle
    this.kullaniciBakiyesiniGuncelle(kullaniciId, netKazanc);
    const yeniBakiye = this.kullaniciBakiyesiniAl(kullaniciId);

    const blackjackEmbed = new EmbedBuilder()
      .setTitle('Blackjack Oyunu Sonucu')
      .setDescription(sonuc)
      .setColor(kazancKatsayisi >= 1 ? '#2ecc71' : '#e74c3c')
      .addFields(
        {
          name: 'Oyuncu Kartları',
          value: `**Kartlar:** ${oyuncuKart1} + ${oyuncuKart2}\n**Toplam:** ${oyuncuToplam}`,
          inline: true
        },
        {
          name: 'Krupiye Kartları',
          value: `**Kartlar:** ${krupiyeKart1} + ${krupiyeKart2}\n**Toplam:** ${krupiyeToplam}`,
          inline: true
        },
        {
          name: 'Kazanç Bilgileri',
          value: `**Bahis:** ${bahisMiktari.toLocaleString('tr-TR')} coin\n**Kazanılan:** ${kazanilanMiktar.toLocaleString('tr-TR')} coin\n**Net:** ${netKazanc >= 0 ? '+' : ''}${netKazanc.toLocaleString('tr-TR')} coin\n**Bakiye:** ${yeniBakiye.toLocaleString('tr-TR')} coin`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Oyuncu: ${interaction.user.tag} • Blackjack`,
        iconURL: interaction.user.displayAvatarURL()
      });

    await interaction.editReply({ embeds: [blackjackEmbed] });
  },

  async ruletOyunu(interaction) {
    const bahisMiktari = interaction.options.getInteger('bahis');
    const secim = interaction.options.getString('secim');
    const kullaniciId = interaction.user.id;

    // Kullanıcı bakiyesini kontrol et
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription('Belirtilen bahis miktarı için yeterli bakiyeniz bulunmamaktadır.')
        .setColor('#e74c3c')
        .setTimestamp();

      return await interaction.editReply({ embeds: [yetersizBakiyeEmbed] });
    }

    // Rulet çarkı (0-36)
    const ruletSonucu = Math.floor(Math.random() * 37);
    
    // Renk belirleme (0 yeşil, 1-10,19-28 kırmızı-siyah alternatif, 11-18,29-36 siyah-kırmızı alternatif)
    let renk = 'yesil';
    if (ruletSonucu !== 0) {
      const kirmiziler = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      renk = kirmiziler.includes(ruletSonucu) ? 'kirmizi' : 'siyah';
    }

    const ciftMi = ruletSonucu !== 0 && ruletSonucu % 2 === 0;
    const tekMi = ruletSonucu !== 0 && ruletSonucu % 2 === 1;

    // Kazanç hesaplama
    let kazandiMi = false;
    let kazancKatsayisi = 0;

    switch (secim) {
      case 'kirmizi':
        kazandiMi = renk === 'kirmizi';
        kazancKatsayisi = 2;
        break;
      case 'siyah':
        kazandiMi = renk === 'siyah';
        kazancKatsayisi = 2;
        break;
      case 'cift':
        kazandiMi = ciftMi;
        kazancKatsayisi = 2;
        break;
      case 'tek':
        kazandiMi = tekMi;
        kazancKatsayisi = 2;
        break;
    }

    const kazanilanMiktar = kazandiMi ? bahisMiktari * kazancKatsayisi : 0;
    const netKazanc = kazanilanMiktar - bahisMiktari;

    // Bakiyeyi güncelle
    this.kullaniciBakiyesiniGuncelle(kullaniciId, netKazanc);
    const yeniBakiye = this.kullaniciBakiyesiniAl(kullaniciId);

    const secimAciklamasi = {
      'kirmizi': 'Kırmızı',
      'siyah': 'Siyah',
      'cift': 'Çift Sayı',
      'tek': 'Tek Sayı'
    };

    const renkAciklamasi = {
      'kirmizi': 'Kırmızı',
      'siyah': 'Siyah',
      'yesil': 'Yeşil'
    };

    const ruletEmbed = new EmbedBuilder()
      .setTitle('Rulet Oyunu Sonucu')
      .setDescription(kazandiMi ? 'Tebrikler! Bahsiniz tuttu.' : 'Maalesef bahsiniz tutmadı.')
      .setColor(kazandiMi ? '#2ecc71' : '#e74c3c')
      .addFields(
        {
          name: 'Rulet Sonucu',
          value: `**Çıkan Sayı:** ${ruletSonucu}\n**Renk:** ${renkAciklamasi[renk]}\n**Tür:** ${ruletSonucu === 0 ? 'Sıfır' : (ciftMi ? 'Çift' : 'Tek')}`,
          inline: true
        },
        {
          name: 'Bahis Bilgileri',
          value: `**Seçiminiz:** ${secimAciklamasi[secim]}\n**Bahis Miktarı:** ${bahisMiktari.toLocaleString('tr-TR')} coin\n**Sonuç:** ${kazandiMi ? 'Kazandınız' : 'Kaybettiniz'}`,
          inline: true
        },
        {
          name: 'Kazanç Bilgileri',
          value: `**Kazanılan:** ${kazanilanMiktar.toLocaleString('tr-TR')} coin\n**Net Kazanç:** ${netKazanc >= 0 ? '+' : ''}${netKazanc.toLocaleString('tr-TR')} coin\n**Güncel Bakiye:** ${yeniBakiye.toLocaleString('tr-TR')} coin`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Oyuncu: ${interaction.user.tag} • Rulet`,
        iconURL: interaction.user.displayAvatarURL()
      });

    await interaction.editReply({ embeds: [ruletEmbed] });
  },

  async bakiyeGoruntule(interaction) {
    const kullaniciId = interaction.user.id;
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);

    const bakiyeEmbed = new EmbedBuilder()
      .setTitle('Kumar Bakiyesi')
      .setDescription('Mevcut kumar bakiyeniz aşağıda görüntülenmektedir.')
      .setColor('#3498db')
      .addFields(
        {
          name: 'Güncel Bakiye',
          value: `${mevcutBakiye.toLocaleString('tr-TR')} coin`,
          inline: true
        },
        {
          name: 'Hesap Durumu',
          value: mevcutBakiye > 0 ? 'Aktif' : 'Bakiye Yetersiz',
          inline: true
        },
        {
          name: 'Son Güncelleme',
          value: new Date().toLocaleString('tr-TR'),
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Oyuncu: ${interaction.user.tag} • Bakiye Sorgusu`,
        iconURL: interaction.user.displayAvatarURL()
      });

    await interaction.editReply({ embeds: [bakiyeEmbed] });
  },

  // Yardımcı fonksiyonlar
  kullaniciBakiyesiniAl(kullaniciId) {
    // Bu fonksiyon gerçek bir veritabanı bağlantısı gerektirir
    // Şimdilik sabit bir değer döndürüyoruz
    return 1000; // Başlangıç bakiyesi
  },

  kullaniciBakiyesiniGuncelle(kullaniciId, miktar) {
    // Bu fonksiyon gerçek bir veritabanı güncellemesi gerektirir
    // Şimdilik konsola yazdırıyoruz
    console.log(`Kullanıcı ${kullaniciId} bakiyesi ${miktar} kadar güncellendi`);
  }
};
