const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumar')
    .setDescription('Kumar oyunları menüsünü açar ve istediğiniz oyunu oynayabilirsiniz'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // Ana menü embed'i
      const anaMenuEmbed = new EmbedBuilder()
        .setTitle('Kumar Oyunları Merkezi')
        .setDescription('Aşağıdaki menüden oynamak istediğiniz kumar oyununu seçiniz. Her oyunun kendine özgü kuralları ve kazanç oranları bulunmaktadır.')
        .setColor('#f39c12')
        .addFields(
          {
            name: 'Mevcut Oyunlar',
            value: '**Zar Oyunu:** Zar sonucunu tahmin edin (1-6)\n**Slot Makinesi:** Üç sembolü eşleştirin\n**Blackjack:** 21\'e en yakın olmaya çalışın\n**Rulet:** Renk veya sayı türü seçin\n**Bakiye:** Mevcut coin durumunuzu görün',
            inline: false
          },
          {
            name: 'Oyun Kuralları',
            value: 'Tüm oyunlarda bahis yapmadan önce yeterli bakiyeniz olduğundan emin olun. Kazanç oranları oyuna göre değişiklik gösterir.',
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Oyuncu: ${interaction.user.tag} • Kumar Merkezi`,
          iconURL: interaction.user.displayAvatarURL()
        });

      // Oyun seçim menüsü
      const oyunSecimMenusu = new StringSelectMenuBuilder()
        .setCustomId('kumar_oyun_secim')
        .setPlaceholder('Oynamak istediğiniz oyunu seçiniz')
        .addOptions([
          {
            label: 'Zar Oyunu',
            description: 'Zar sonucunu tahmin edin - 5x kazanç şansı',
            value: 'zar_oyunu'
          },
          {
            label: 'Slot Makinesi',
            description: 'Üç sembolü eşleştirin - 50x\'e kadar kazanç',
            value: 'slot_oyunu'
          },
          {
            label: 'Blackjack',
            description: '21\'e en yakın olun - 2.5x kazanç şansı',
            value: 'blackjack_oyunu'
          },
          {
            label: 'Rulet',
            description: 'Renk veya sayı türü seçin - 2x kazanç',
            value: 'rulet_oyunu'
          },
          {
            label: 'Bakiye Görüntüle',
            description: 'Mevcut coin bakiyenizi kontrol edin',
            value: 'bakiye_goruntule'
          }
        ]);

      const menuSatiri = new ActionRowBuilder().addComponents(oyunSecimMenusu);

      const mesaj = await interaction.editReply({
        embeds: [anaMenuEmbed],
        components: [menuSatiri]
      });

      // Menü etkileşimi için collector
      const collector = mesaj.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000 // 5 dakika
      });

      collector.on('collect', async (menuEtkilesimi) => {
        if (menuEtkilesimi.user.id !== interaction.user.id) {
          await menuEtkilesimi.reply({
            content: 'Bu menüyü sadece komutu kullanan kişi kullanabilir.',
            ephemeral: true
          });
          return;
        }

        const secilenOyun = menuEtkilesimi.values[0];

        switch (secilenOyun) {
          case 'zar_oyunu':
            await this.zarOyunuBaslat(menuEtkilesimi);
            break;
          case 'slot_oyunu':
            await this.slotOyunuBaslat(menuEtkilesimi);
            break;
          case 'blackjack_oyunu':
            await this.blackjackOyunuBaslat(menuEtkilesimi);
            break;
          case 'rulet_oyunu':
            await this.ruletOyunuBaslat(menuEtkilesimi);
            break;
          case 'bakiye_goruntule':
            await this.bakiyeGoruntule(menuEtkilesimi);
            break;
        }
      });

      collector.on('end', async () => {
        try {
          const deaktifMenu = new StringSelectMenuBuilder()
            .setCustomId('kumar_oyun_secim_deaktif')
            .setPlaceholder('Menü süresi doldu')
            .setDisabled(true)
            .addOptions([
              {
                label: 'Süresi Dolmuş',
                description: 'Yeni bir kumar komutu kullanın',
                value: 'suresi_dolmus'
              }
            ]);

          const deaktifSatir = new ActionRowBuilder().addComponents(deaktifMenu);

          await interaction.editReply({
            components: [deaktifSatir]
          });
        } catch (hata) {
          console.log('Menü deaktif edilirken hata:', hata.message);
        }
      });

    } catch (hata) {
      console.error('Kumar menüsü oluşturulurken hata:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Menü Hatası')
        .setDescription('Kumar oyunları menüsü oluşturulurken bir hata oluştu.')
        .setColor('#e74c3c')
        .setTimestamp();

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  },

  async zarOyunuBaslat(interaction) {
    await interaction.deferUpdate();

    const zarEmbed = new EmbedBuilder()
      .setTitle('Zar Oyunu')
      .setDescription('Zar oyunu oynamak için bahis miktarınızı ve tahmininizi belirtiniz.')
      .setColor('#e67e22')
      .addFields(
        {
          name: 'Oyun Kuralları',
          value: 'Zar 1-6 arasında bir sayı gösterecek. Doğru tahmin ederseniz bahsinizin 5 katını kazanırsınız.',
          inline: false
        },
        {
          name: 'Bahis Limitleri',
          value: 'Minimum: 1 coin\nMaksimum: 10.000 coin',
          inline: true
        },
        {
          name: 'Kazanç Oranı',
          value: '5x (Doğru tahmin)',
          inline: true
        }
      );

    // Bahis miktarı butonları
    const bahisButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('zar_bahis_10').setLabel('10 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('zar_bahis_50').setLabel('50 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('zar_bahis_100').setLabel('100 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('zar_bahis_500').setLabel('500 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('zar_bahis_1000').setLabel('1000 Coin').setStyle(ButtonStyle.Secondary)
      );

    // Zar tahmin butonları
    const zarTahminleri = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('zar_tahmin_1').setLabel('1').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('zar_tahmin_2').setLabel('2').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('zar_tahmin_3').setLabel('3').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('zar_tahmin_4').setLabel('4').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('zar_tahmin_5').setLabel('5').setStyle(ButtonStyle.Primary)
      );

    const zarTahmin6 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('zar_tahmin_6').setLabel('6').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menüye Dön').setStyle(ButtonStyle.Danger)
      );

    await interaction.editReply({
      embeds: [zarEmbed],
      components: [bahisButonlari, zarTahminleri, zarTahmin6]
    });

    this.zarOyunuEtkilesileriDinle(interaction);
  },

  async zarOyunuEtkilesileriDinle(interaction) {
    let secilenBahis = null;
    let secilenTahmin = null;

    const collector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) {
        await butonEtkilesimi.reply({
          content: 'Bu oyunu sadece başlatan kişi oynayabilir.',
          ephemeral: true
        });
        return;
      }

      const butonId = butonEtkilesimi.customId;

      if (butonId.startsWith('zar_bahis_')) {
        secilenBahis = parseInt(butonId.split('_')[2]);
        await butonEtkilesimi.reply({
          content: `Bahis miktarı seçildi: ${secilenBahis} coin. Şimdi tahmininizi seçin.`,
          ephemeral: true
        });
      } else if (butonId.startsWith('zar_tahmin_')) {
        secilenTahmin = parseInt(butonId.split('_')[2]);
        
        if (!secilenBahis) {
          await butonEtkilesimi.reply({
            content: 'Önce bahis miktarınızı seçiniz.',
            ephemeral: true
          });
          return;
        }

        await this.zarOyunuOyna(butonEtkilesimi, secilenBahis, secilenTahmin);
        collector.stop();
      } else if (butonId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
        collector.stop();
      }
    });
  },

  async zarOyunuOyna(interaction, bahisMiktari, kullaniciTahmini) {
    await interaction.deferUpdate();

    const kullaniciId = interaction.user.id;
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription(`Bahis için ${bahisMiktari} coin gerekli, ancak bakiyenizde ${mevcutBakiye} coin bulunuyor.`)
        .setColor('#e74c3c');

      await interaction.editReply({
        embeds: [yetersizBakiyeEmbed],
        components: []
      });
      return;
    }

    // Zar atılması
    const zarSonucu = Math.floor(Math.random() * 6) + 1;
    const kazandiMi = zarSonucu === kullaniciTahmini;
    const kazanilanMiktar = kazandiMi ? bahisMiktari * 5 : 0;
    const netKazanc = kazandiMi ? kazanilanMiktar - bahisMiktari : -bahisMiktari;

    // Bakiyeyi güncelle
    this.kullaniciBakiyesiniGuncelle(kullaniciId, netKazanc);
    const yeniBakiye = this.kullaniciBakiyesiniAl(kullaniciId);

    const zarSonucEmbed = new EmbedBuilder()
      .setTitle('Zar Oyunu Sonucu')
      .setDescription(kazandiMi ? 'Tebrikler! Tahmininiz doğru çıktı.' : 'Maalesef tahmininiz yanlış çıktı.')
      .setColor(kazandiMi ? '#2ecc71' : '#e74c3c')
      .addFields(
        {
          name: 'Oyun Detayları',
          value: `**Tahmininiz:** ${kullaniciTahmini}\n**Zar Sonucu:** ${zarSonucu}\n**Bahis:** ${bahisMiktari.toLocaleString('tr-TR')} coin`,
          inline: true
        },
        {
          name: 'Sonuç',
          value: `**Durum:** ${kazandiMi ? 'Kazandınız' : 'Kaybettiniz'}\n**Kazanç:** ${kazanilanMiktar.toLocaleString('tr-TR')} coin\n**Net:** ${netKazanc >= 0 ? '+' : ''}${netKazanc.toLocaleString('tr-TR')} coin`,
          inline: true
        },
        {
          name: 'Bakiye',
          value: `**Önceki:** ${(yeniBakiye - netKazanc).toLocaleString('tr-TR')} coin\n**Güncel:** ${yeniBakiye.toLocaleString('tr-TR')} coin`,
          inline: false
        }
      )
      .setTimestamp();

    const tekrarOynaButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('zar_tekrar_oyna').setLabel('Tekrar Oyna').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menü').setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [zarSonucEmbed],
      components: [tekrarOynaButonlari]
    });

    // Tekrar oyna butonları için listener
    const tekrarCollector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    tekrarCollector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) return;

      if (butonEtkilesimi.customId === 'zar_tekrar_oyna') {
        await this.zarOyunuBaslat(butonEtkilesimi);
      } else if (butonEtkilesimi.customId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
      }
      tekrarCollector.stop();
    });
  },

  async slotOyunuBaslat(interaction) {
    await interaction.deferUpdate();

    const slotEmbed = new EmbedBuilder()
      .setTitle('Slot Makinesi')
      .setDescription('Slot makinesi oyunu için bahis miktarınızı seçiniz.')
      .setColor('#9b59b6')
      .addFields(
        {
          name: 'Oyun Kuralları',
          value: 'Üç sembol eşleşirse kazanırsınız. Elmas en yüksek kazancı verir.',
          inline: false
        },
        {
          name: 'Kazanç Oranları',
          value: '**Üç Elmas:** 50x\n**Üç Yedi:** 25x\n**Üç Yıldız:** 15x\n**Diğer Üçlü:** 10x\n**İkili:** 2x',
          inline: false
        }
      );

    const slotBahisButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('slot_bahis_25').setLabel('25 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('slot_bahis_100').setLabel('100 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('slot_bahis_250').setLabel('250 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('slot_bahis_500').setLabel('500 Coin').setStyle(ButtonStyle.Secondary)
      );

    const slotKontrolButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('slot_bahis_1000').setLabel('1000 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menüye Dön').setStyle(ButtonStyle.Danger)
      );

    await interaction.editReply({
      embeds: [slotEmbed],
      components: [slotBahisButonlari, slotKontrolButonlari]
    });

    this.slotOyunuEtkilesileriDinle(interaction);
  },

  async slotOyunuEtkilesileriDinle(interaction) {
    const collector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) {
        await butonEtkilesimi.reply({
          content: 'Bu oyunu sadece başlatan kişi oynayabilir.',
          ephemeral: true
        });
        return;
      }

      const butonId = butonEtkilesimi.customId;

      if (butonId.startsWith('slot_bahis_')) {
        const bahisMiktari = parseInt(butonId.split('_')[2]);
        await this.slotOyunuOyna(butonEtkilesimi, bahisMiktari);
        collector.stop();
      } else if (butonId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
        collector.stop();
      }
    });
  },

  async slotOyunuOyna(interaction, bahisMiktari) {
    await interaction.deferUpdate();

    const kullaniciId = interaction.user.id;
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription(`Bahis için ${bahisMiktari} coin gerekli, ancak bakiyenizde ${mevcutBakiye} coin bulunuyor.`)
        .setColor('#e74c3c');

      await interaction.editReply({
        embeds: [yetersizBakiyeEmbed],
        components: []
      });
      return;
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
      kazancKatsayisi = 2;
      kazancAciklamasi = 'İki Eşleşme';
    } else {
      kazancKatsayisi = 0;
      kazancAciklamasi = 'Eşleşme Yok';
    }

    const kazanilanMiktar = bahisMiktari * kazancKatsayisi;
    const netKazanc = kazanilanMiktar - bahisMiktari;

    // Bakiyeyi güncelle
    this.kullaniciBakiyesiniGuncelle(kullaniciId, netKazanc);
    const yeniBakiye = this.kullaniciBakiyesiniAl(kullaniciId);

    const slotSonucEmbed = new EmbedBuilder()
      .setTitle('Slot Makinesi Sonucu')
      .setDescription(`**${slot1} | ${slot2} | ${slot3}**\n\n${kazancAciklamasi}`)
      .setColor(kazancKatsayisi > 0 ? '#2ecc71' : '#e74c3c')
      .addFields(
        {
          name: 'Oyun Sonucu',
          value: `**Katsayı:** x${kazancKatsayisi}\n**Bahis:** ${bahisMiktari.toLocaleString('tr-TR')} coin\n**Kazanç:** ${kazanilanMiktar.toLocaleString('tr-TR')} coin`,
          inline: true
        },
        {
          name: 'Bakiye Durumu',
          value: `**Net:** ${netKazanc >= 0 ? '+' : ''}${netKazanc.toLocaleString('tr-TR')} coin\n**Güncel Bakiye:** ${yeniBakiye.toLocaleString('tr-TR')} coin`,
          inline: true
        }
      )
      .setTimestamp();

    const tekrarOynaButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('slot_tekrar_oyna').setLabel('Tekrar Oyna').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menü').setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [slotSonucEmbed],
      components: [tekrarOynaButonlari]
    });

    // Tekrar oyna listener
    const tekrarCollector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    tekrarCollector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) return;

      if (butonEtkilesimi.customId === 'slot_tekrar_oyna') {
        await this.slotOyunuBaslat(butonEtkilesimi);
      } else if (butonEtkilesimi.customId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
      }
      tekrarCollector.stop();
    });
  },

  async blackjackOyunuBaslat(interaction) {
    await interaction.deferUpdate();

    const blackjackEmbed = new EmbedBuilder()
      .setTitle('Blackjack Oyunu')
      .setDescription('Blackjack oyunu için bahis miktarınızı seçiniz.')
      .setColor('#34495e')
      .addFields(
        {
          name: 'Oyun Kuralları',
          value: '21\'e en yakın olmaya çalışın. 21\'i geçerseniz kaybedersiniz. Krupiye 17\'de durur.',
          inline: false
        },
        {
          name: 'Kazanç Oranları',
          value: '**Blackjack:** 2.5x\n**Normal Kazanç:** 2x\n**Berabere:** Bahis iadesi',
          inline: false
        }
      );

    const blackjackBahisButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('blackjack_bahis_50').setLabel('50 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('blackjack_bahis_100').setLabel('100 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('blackjack_bahis_250').setLabel('250 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('blackjack_bahis_500').setLabel('500 Coin').setStyle(ButtonStyle.Secondary)
      );

    const blackjackKontrolButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('blackjack_bahis_1000').setLabel('1000 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menüye Dön').setStyle(ButtonStyle.Danger)
      );

    await interaction.editReply({
      embeds: [blackjackEmbed],
      components: [blackjackBahisButonlari, blackjackKontrolButonlari]
    });

    this.blackjackOyunuEtkilesileriDinle(interaction);
  },

  async blackjackOyunuEtkilesileriDinle(interaction) {
    const collector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) {
        await butonEtkilesimi.reply({
          content: 'Bu oyunu sadece başlatan kişi oynayabilir.',
          ephemeral: true
        });
        return;
      }

      const butonId = butonEtkilesimi.customId;

      if (butonId.startsWith('blackjack_bahis_')) {
        const bahisMiktari = parseInt(butonId.split('_')[2]);
        await this.blackjackOyunuOyna(butonEtkilesimi, bahisMiktari);
        collector.stop();
      } else if (butonId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
        collector.stop();
      }
    });
  },

  async blackjackOyunuOyna(interaction, bahisMiktari) {
    await interaction.deferUpdate();

    const kullaniciId = interaction.user.id;
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription(`Bahis için ${bahisMiktari} coin gerekli, ancak bakiyenizde ${mevcutBakiye} coin bulunuyor.`)
        .setColor('#e74c3c');

      await interaction.editReply({
        embeds: [yetersizBakiyeEmbed],
        components: []
      });
      return;
    }

    // Kart değerleri
    const kartlar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
    
    // Oyuncu kartları
    const oyuncuKart1 = kartlar[Math.floor(Math.random() * kartlar.length)];
    const oyuncuKart2 = kartlar[Math.floor(Math.random() * kartlar.length)];
    let oyuncuToplam = oyuncuKart1 + oyuncuKart2;

    // As kontrolü
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

    const blackjackSonucEmbed = new EmbedBuilder()
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
      .setTimestamp();

    const tekrarOynaButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('blackjack_tekrar_oyna').setLabel('Tekrar Oyna').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menü').setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [blackjackSonucEmbed],
      components: [tekrarOynaButonlari]
    });

    // Tekrar oyna listener
    const tekrarCollector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    tekrarCollector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) return;

      if (butonEtkilesimi.customId === 'blackjack_tekrar_oyna') {
        await this.blackjackOyunuBaslat(butonEtkilesimi);
      } else if (butonEtkilesimi.customId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
      }
      tekrarCollector.stop();
    });
  },

  async ruletOyunuBaslat(interaction) {
    await interaction.deferUpdate();

    const ruletEmbed = new EmbedBuilder()
      .setTitle('Rulet Oyunu')
      .setDescription('Rulet oyunu için bahis türünüzü ve miktarınızı seçiniz.')
      .setColor('#c0392b')
      .addFields(
        {
          name: 'Bahis Türleri',
          value: '**Kırmızı/Siyah:** 2x kazanç\n**Çift/Tek Sayı:** 2x kazanç',
          inline: false
        },
        {
          name: 'Rulet Kuralları',
          value: 'Rulet 0-36 arası sayı gösterir. 0 yeşildir ve tüm bahisleri kaybettirir.',
          inline: false
        }
      );

    const ruletBahisTurleri = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('rulet_kirmizi').setLabel('Kırmızı').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('rulet_siyah').setLabel('Siyah').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('rulet_cift').setLabel('Çift Sayı').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('rulet_tek').setLabel('Tek Sayı').setStyle(ButtonStyle.Success)
      );

    const ruletKontrolButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menüye Dön').setStyle(ButtonStyle.Danger)
      );

    await interaction.editReply({
      embeds: [ruletEmbed],
      components: [ruletBahisTurleri, ruletKontrolButonlari]
    });

    this.ruletOyunuEtkilesileriDinle(interaction);
  },

  async ruletOyunuEtkilesileriDinle(interaction) {
    const collector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) {
        await butonEtkilesimi.reply({
          content: 'Bu oyunu sadece başlatan kişi oynayabilir.',
          ephemeral: true
        });
        return;
      }

      const butonId = butonEtkilesimi.customId;

      if (butonId.startsWith('rulet_')) {
        const secim = butonId.split('_')[1];
        await this.ruletBahisMiktariSec(butonEtkilesimi, secim);
        collector.stop();
      } else if (butonId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
        collector.stop();
      }
    });
  },

  async ruletBahisMiktariSec(interaction, secim) {
    await interaction.deferUpdate();

    const secimAciklamasi = {
      'kirmizi': 'Kırmızı',
      'siyah': 'Siyah',
      'cift': 'Çift Sayı',
      'tek': 'Tek Sayı'
    };

    const bahisSecimEmbed = new EmbedBuilder()
      .setTitle('Rulet Bahis Miktarı')
      .setDescription(`**${secimAciklamasi[secim]}** seçtiniz. Şimdi bahis miktarınızı belirleyiniz.`)
      .setColor('#c0392b');

    const ruletBahisButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId(`rulet_oyna_${secim}_100`).setLabel('100 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rulet_oyna_${secim}_250`).setLabel('250 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rulet_oyna_${secim}_500`).setLabel('500 Coin').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rulet_oyna_${secim}_1000`).setLabel('1000 Coin').setStyle(ButtonStyle.Secondary)
      );

    const ruletKontrolButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('rulet_geri_don').setLabel('Geri Dön').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menü').setStyle(ButtonStyle.Danger)
      );

    await interaction.editReply({
      embeds: [bahisSecimEmbed],
      components: [ruletBahisButonlari, ruletKontrolButonlari]
    });

    // Bahis miktarı seçimi için collector
    const bahisCollector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    bahisCollector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) return;

      const butonId = butonEtkilesimi.customId;

      if (butonId.startsWith('rulet_oyna_')) {
        const [, , secilenSecim, bahisMiktari] = butonId.split('_');
        await this.ruletOyunuOyna(butonEtkilesimi, secilenSecim, parseInt(bahisMiktari));
        bahisCollector.stop();
      } else if (butonId === 'rulet_geri_don') {
        await this.ruletOyunuBaslat(butonEtkilesimi);
        bahisCollector.stop();
      } else if (butonId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
        bahisCollector.stop();
      }
    });
  },

  async ruletOyunuOyna(interaction, secim, bahisMiktari) {
    await interaction.deferUpdate();

    const kullaniciId = interaction.user.id;
    const mevcutBakiye = this.kullaniciBakiyesiniAl(kullaniciId);
    
    if (mevcutBakiye < bahisMiktari) {
      const yetersizBakiyeEmbed = new EmbedBuilder()
        .setTitle('Yetersiz Bakiye')
        .setDescription(`Bahis için ${bahisMiktari} coin gerekli, ancak bakiyenizde ${mevcutBakiye} coin bulunuyor.`)
        .setColor('#e74c3c');

      await interaction.editReply({
        embeds: [yetersizBakiyeEmbed],
        components: []
      });
      return;
    }

    // Rulet çarkı (0-36)
    const ruletSonucu = Math.floor(Math.random() * 37);
    
    // Renk belirleme
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

    const ruletSonucEmbed = new EmbedBuilder()
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
          value: `**Seçiminiz:** ${secimAciklamasi[secim]}\n**Bahis:** ${bahisMiktari.toLocaleString('tr-TR')} coin\n**Sonuç:** ${kazandiMi ? 'Kazandınız' : 'Kaybettiniz'}`,
          inline: true
        },
        {
          name: 'Kazanç Bilgileri',
          value: `**Kazanılan:** ${kazanilanMiktar.toLocaleString('tr-TR')} coin\n**Net:** ${netKazanc >= 0 ? '+' : ''}${netKazanc.toLocaleString('tr-TR')} coin\n**Bakiye:** ${yeniBakiye.toLocaleString('tr-TR')} coin`,
          inline: false
        }
      )
      .setTimestamp();

    const tekrarOynaButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('rulet_tekrar_oyna').setLabel('Tekrar Oyna').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menü').setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [ruletSonucEmbed],
      components: [tekrarOynaButonlari]
    });

    // Tekrar oyna listener
    const tekrarCollector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    tekrarCollector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) return;

      if (butonEtkilesimi.customId === 'rulet_tekrar_oyna') {
        await this.ruletOyunuBaslat(butonEtkilesimi);
      } else if (butonEtkilesimi.customId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
      }
      tekrarCollector.stop();
    });
  },

  async bakiyeGoruntule(interaction) {
    await interaction.deferUpdate();

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
        },
        {
          name: 'Oyun Önerileri',
          value: mevcutBakiye >= 1000 ? 'Tüm oyunları oynayabilirsiniz' : 
                mevcutBakiye >= 500 ? 'Orta seviye bahisler önerilir' :
                mevcutBakiye >= 100 ? 'Düşük bahislerle başlayın' : 'Bakiye yetersiz',
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Oyuncu: ${interaction.user.tag} • Bakiye Sorgusu`,
        iconURL: interaction.user.displayAvatarURL()
      });

    const bakiyeButonlari = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('bakiye_yenile').setLabel('Bakiyeyi Yenile').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ana_menu_don').setLabel('Ana Menü').setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [bakiyeEmbed],
      components: [bakiyeButonlari]
    });

    // Bakiye butonları için listener
    const bakiyeCollector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    bakiyeCollector.on('collect', async (butonEtkilesimi) => {
      if (butonEtkilesimi.user.id !== interaction.user.id) return;

      if (butonEtkilesimi.customId === 'bakiye_yenile') {
        await this.bakiyeGoruntule(butonEtkilesimi);
      } else if (butonEtkilesimi.customId === 'ana_menu_don') {
        await this.anaMenuyeDon(butonEtkilesimi);
      }
      bakiyeCollector.stop();
    });
  },

  async anaMenuyeDon(interaction) {
    await interaction.deferUpdate();

    // Ana menü embed'i
    const anaMenuEmbed = new EmbedBuilder()
      .setTitle('Kumar Oyunları Merkezi')
      .setDescription('Aşağıdaki menüden oynamak istediğiniz kumar oyununu seçiniz. Her oyunun kendine özgü kuralları ve kazanç oranları bulunmaktadır.')
      .setColor('#f39c12')
      .addFields(
        {
          name: 'Mevcut Oyunlar',
          value: '**Zar Oyunu:** Zar sonucunu tahmin edin (1-6)\n**Slot Makinesi:** Üç sembolü eşleştirin\n**Blackjack:** 21\'e en yakın olmaya çalışın\n**Rulet:** Renk veya sayı türü seçin\n**Bakiye:** Mevcut coin durumunuzu görün',
          inline: false
        },
        {
          name: 'Oyun Kuralları',
          value: 'Tüm oyunlarda bahis yapmadan önce yeterli bakiyeniz olduğundan emin olun. Kazanç oranları oyuna göre değişiklik gösterir.',
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Oyuncu: ${interaction.user.tag} • Kumar Merkezi`,
        iconURL: interaction.user.displayAvatarURL()
      });

    // Oyun seçim menüsü
    const oyunSecimMenusu = new StringSelectMenuBuilder()
      .setCustomId('kumar_oyun_secim')
      .setPlaceholder('Oynamak istediğiniz oyunu seçiniz')
      .addOptions([
        {
          label: 'Zar Oyunu',
          description: 'Zar sonucunu tahmin edin - 5x kazanç şansı',
          value: 'zar_oyunu'
        },
        {
          label: 'Slot Makinesi',
          description: 'Üç sembolü eşleştirin - 50x\'e kadar kazanç',
          value: 'slot_oyunu'
        },
        {
          label: 'Blackjack',
          description: '21\'e en yakın olun - 2.5x kazanç şansı',
          value: 'blackjack_oyunu'
        },
        {
          label: 'Rulet',
          description: 'Renk veya sayı türü seçin - 2x kazanç',
          value: 'rulet_oyunu'
        },
        {
          label: 'Bakiye Görüntüle',
          description: 'Mevcut coin bakiyenizi kontrol edin',
          value: 'bakiye_goruntule'
        }
      ]);

    const menuSatiri = new ActionRowBuilder().addComponents(oyunSecimMenusu);

    await interaction.editReply({
      embeds: [anaMenuEmbed],
      components: [menuSatiri]
    });

    // Yeni menü etkileşimi için collector
    const collector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000
    });

    collector.on('collect', async (menuEtkilesimi) => {
      if (menuEtkilesimi.user.id !== interaction.user.id) {
        await menuEtkilesimi.reply({
          content: 'Bu menüyü sadece komutu kullanan kişi kullanabilir.',
          ephemeral: true
        });
        return;
      }

      const secilenOyun = menuEtkilesimi.values[0];

      switch (secilenOyun) {
        case 'zar_oyunu':
          await this.zarOyunuBaslat(menuEtkilesimi);
          break;
        case 'slot_oyunu':
          await this.slotOyunuBaslat(menuEtkilesimi);
          break;
        case 'blackjack_oyunu':
          await this.blackjackOyunuBaslat(menuEtkilesimi);
          break;
        case 'rulet_oyunu':
          await this.ruletOyunuBaslat(menuEtkilesimi);
          break;
        case 'bakiye_goruntule':
          await this.bakiyeGoruntule(menuEtkilesimi);
          break;
      }
    });
  },

  // Yardımcı fonksiyonlar (Gerçek uygulamada veritabanı kullanılmalı)
  kullaniciBakiyesiniAl(kullaniciId) {
    // Geçici olarak sabit bakiye döndürüyoruz
    // Gerçek uygulamada veritabanından çekilmeli
    if (!this.bakiyeler) this.bakiyeler = new Map();
    return this.bakiyeler.get(kullaniciId) || 5000; // Başlangıç bakiyesi 5000
  },

  kullaniciBakiyesiniGuncelle(kullaniciId, miktar) {
    // Geçici olarak Map kullanıyoruz
    // Gerçek uygulamada veritabanına kaydedilmeli
    if (!this.bakiyeler) this.bakiyeler = new Map();
    const mevcutBakiye = this.bakiyeler.get(kullaniciId) || 5000;
    const yeniBakiye = Math.max(0, mevcutBakiye + miktar); // Bakiye negatif olamaz
    this.bakiyeler.set(kullaniciId, yeniBakiye);
    console.log(`Kullanıcı ${kullaniciId} bakiyesi güncellendi: ${mevcutBakiye} -> ${yeniBakiye} (${miktar >= 0 ? '+' : ''}${miktar})`);
  }
};

    
