const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Roblox platformunda kullanıcı, oyun ve grup bilgilerini detaylı olarak sorgular')
    .addSubcommand(subcommand =>
      subcommand
        .setName('kullanici')
        .setDescription('Belirtilen Roblox kullanıcısının profil bilgilerini görüntüler')
        .addStringOption(option =>
          option.setName('kullanici_adi')
            .setDescription('Sorgulanacak Roblox kullanıcı adını giriniz')
            .setRequired(true)
            .setMaxLength(20)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('oyun')
        .setDescription('Belirtilen Roblox oyununun detaylı bilgilerini görüntüler')
        .addStringOption(option =>
          option.setName('oyun_id')
            .setDescription('Sorgulanacak oyun kimlik numarasını giriniz')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('grup')
        .setDescription('Belirtilen Roblox grubunun detaylı bilgilerini görüntüler')
        .addStringOption(option =>
          option.setName('grup_id')
            .setDescription('Sorgulanacak grup kimlik numarasını giriniz')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('avatar')
        .setDescription('Belirtilen kullanıcının avatar bilgilerini görüntüler')
        .addStringOption(option =>
          option.setName('kullanici_adi')
            .setDescription('Avatar bilgileri sorgulanacak kullanıcı adını giriniz')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const altKomut = interaction.options.getSubcommand();

      switch (altKomut) {
        case 'kullanici':
          await this.kullaniciBilgisiSorgula(interaction);
          break;
        case 'oyun':
          await this.oyunBilgisiSorgula(interaction);
          break;
        case 'grup':
          await this.grupBilgisiSorgula(interaction);
          break;
        case 'avatar':
          await this.avatarBilgisiSorgula(interaction);
          break;
        default:
          await interaction.editReply({
            content: 'Geçersiz alt komut belirtildi. Lütfen geçerli bir seçenek kullanınız.',
            ephemeral: true
          });
      }
    } catch (hata) {
      console.error('Roblox sorgu işlemi sırasında hata oluştu:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Sorgu İşlemi Hatası')
        .setDescription('Roblox platformından bilgiler alınırken beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.')
        .setColor('#e74c3c')
        .addFields(
          {
            name: 'Hata Detayı',
            value: hata.message || 'Bilinmeyen hata',
            inline: false
          },
          {
            name: 'Öneriler',
            value: '• İnternet bağlantınızı kontrol ediniz\n• Girdiğiniz bilgilerin doğruluğunu kontrol ediniz\n• Birkaç dakika sonra tekrar deneyiniz',
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: 'Roblox Sorgu Sistemi'
        });

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  },

  async kullaniciBilgisiSorgula(interaction) {
    const kullaniciAdi = interaction.options.getString('kullanici_adi').trim();

    try {
      // Kullanıcı kimlik numarasını sorgula
      const kullaniciAramaYaniti = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [kullaniciAdi],
        excludeBannedUsers: false
      });

      if (!kullaniciAramaYaniti.data.data || kullaniciAramaYaniti.data.data.length === 0) {
        const bulunamadiEmbed = new EmbedBuilder()
          .setTitle('Kullanıcı Bulunamadı')
          .setDescription(`Belirtilen "${kullaniciAdi}" kullanıcı adına sahip bir hesap bulunamadı.`)
          .setColor('#e74c3c')
          .addFields({
            name: 'Kontrol Edilecek Hususlar',
            value: '• Kullanıcı adının doğru yazıldığından emin olunuz\n• Büyük-küçük harf duyarlılığını kontrol ediniz\n• Kullanıcının hesabının aktif olduğundan emin olunuz',
            inline: false
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [bulunamadiEmbed] });
      }

      const kullaniciId = kullaniciAramaYaniti.data.data[0].id;

      // Kullanıcı detay bilgilerini sorgula
      const kullaniciDetayYaniti = await axios.get(`https://users.roblox.com/v1/users/${kullaniciId}`);
      const kullaniciVerisi = kullaniciDetayYaniti.data;

      // Avatar görselini sorgula
      const avatarYaniti = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${kullaniciId}&size=420x420&format=Png&isCircular=false`);
      const avatarUrl = avatarYaniti.data.data[0]?.imageUrl || null;

      // Kullanıcı istatistiklerini sorgula
      let arkadasSayisi = 'Bilgi Alınamadı';
      let takipciSayisi = 'Bilgi Alınamadı';
      let takipEdilenSayisi = 'Bilgi Alınamadı';

      try {
        const arkadasYaniti = await axios.get(`https://friends.roblox.com/v1/users/${kullaniciId}/friends/count`);
        arkadasSayisi = arkadasYaniti.data.count.toLocaleString('tr-TR');
      } catch (hata) {
        console.warn('Arkadaş sayısı alınamadı:', hata.message);
      }

      try {
        const takipciYaniti = await axios.get(`https://friends.roblox.com/v1/users/${kullaniciId}/followers/count`);
        takipciSayisi = takipciYaniti.data.count.toLocaleString('tr-TR');
      } catch (hata) {
        console.warn('Takipçi sayısı alınamadı:', hata.message);
      }

      try {
        const takipEdilenYaniti = await axios.get(`https://friends.roblox.com/v1/users/${kullaniciId}/followings/count`);
        takipEdilenSayisi = takipEdilenYaniti.data.count.toLocaleString('tr-TR');
      } catch (hata) {
        console.warn('Takip edilen sayısı alınamadı:', hata.message);
      }

      // Hesap yaşını hesapla
      const hesapOlusturmaTarihi = new Date(kullaniciVerisi.created);
      const guncelTarih = new Date();
      const hesapYasiGun = Math.floor((guncelTarih - hesapOlusturmaTarihi) / (1000 * 60 * 60 * 24));
      const hesapYasiYil = Math.floor(hesapYasiGun / 365);
      const hesapYasiAy = Math.floor((hesapYasiGun % 365) / 30);

      // Kullanıcı durumunu sorgula
      let kullaniciDurumu = 'Bilinmiyor';
      try {
        const durumYaniti = await axios.get(`https://presence.roblox.com/v1/presence/users`, {
          params: { userIds: kullaniciId }
        });
        const durumBilgisi = durumYaniti.data.userPresences[0];
        if (durumBilgisi) {
          switch (durumBilgisi.userPresenceType) {
            case 0: kullaniciDurumu = 'Çevrimdışı'; break;
            case 1: kullaniciDurumu = 'Çevrimiçi'; break;
            case 2: kullaniciDurumu = 'Oyun Oynuyor'; break;
            case 3: kullaniciDurumu = 'Stüdyo Kullanıyor'; break;
            default: kullaniciDurumu = 'Bilinmiyor';
          }
        }
      } catch (hata) {
        console.warn('Kullanıcı durumu alınamadı:', hata.message);
      }

      const kullaniciEmbed = new EmbedBuilder()
        .setTitle(`${kullaniciVerisi.displayName} Kullanıcı Profili`)
        .setDescription(kullaniciVerisi.description || 'Bu kullanıcı henüz bir profil açıklaması eklememişdir.')
        .setColor('#00b2ff')
        .addFields(
          {
            name: 'Temel Kullanıcı Bilgileri',
            value: `**Kullanıcı Kimlik Numarası:** ${kullaniciVerisi.id}\n**Kullanıcı Adı:** ${kullaniciVerisi.name}\n**Görünen Ad:** ${kullaniciVerisi.displayName}\n**Çevrimiçi Durumu:** ${kullaniciDurumu}`,
            inline: true
          },
          {
            name: 'Sosyal Medya İstatistikleri',
            value: `**Arkadaş Sayısı:** ${arkadasSayisi}\n**Takipçi Sayısı:** ${takipciSayisi}\n**Takip Edilen Sayısı:** ${takipEdilenSayisi}`,
            inline: true
          },
          {
            name: 'Hesap Detay Bilgileri',
            value: `**Hesap Oluşturma Tarihi:** <t:${Math.floor(hesapOlusturmaTarihi.getTime() / 1000)}:D>\n**Hesap Yaşı:** ${hesapYasiYil} yıl, ${hesapYasiAy} ay\n**Toplam Gün:** ${hesapYasiGun.toLocaleString('tr-TR')} gün\n**Doğrulanmış Hesap:** ${kullaniciVerisi.hasVerifiedBadge ? 'Evet' : 'Hayır'}`,
            inline: false
          },
          {
            name: 'Ek Bilgiler',
            value: `**Premium Üyelik:** ${kullaniciVerisi.isPremium ? 'Aktif' : 'Pasif'}\n**Hesap Durumu:** ${kullaniciVerisi.isBanned ? 'Yasaklı' : 'Aktif'}\n**Son Görülme:** <t:${Math.floor(guncelTarih.getTime() / 1000)}:R>`,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Roblox Kullanıcı Sorgu Sistemi • Sorgu Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
          iconURL: 'https://www.roblox.com/favicon.ico'
        });

      if (avatarUrl) {
        kullaniciEmbed.setThumbnail(avatarUrl);
      }

      // Etkileşim butonlarını oluştur
      const profilGoruntuleButonu = new ButtonBuilder()
        .setLabel('Roblox Profilini Görüntüle')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/users/${kullaniciId}/profile`);

      const oyunlarGoruntuleButonu = new ButtonBuilder()
        .setCustomId(`oyunlar_${kullaniciId}`)
        .setLabel('Kullanıcının Oyunlarını Görüntüle')
        .setStyle(ButtonStyle.Primary);

      const avatarGoruntuleButonu = new ButtonBuilder()
        .setCustomId(`avatar_${kullaniciId}`)
        .setLabel('Avatar Detaylarını Görüntüle')
        .setStyle(ButtonStyle.Secondary);

      const istatistikButonu = new ButtonBuilder()
        .setCustomId(`istatistik_${kullaniciId}`)
        .setLabel('Detaylı İstatistikleri Görüntüle')
        .setStyle(ButtonStyle.Success);

      const butonSatiri = new ActionRowBuilder()
        .addComponents(profilGoruntuleButonu, oyunlarGoruntuleButonu, avatarGoruntuleButonu, istatistikButonu);

      await interaction.editReply({
        embeds: [kullaniciEmbed],
        components: [butonSatiri]
      });

    } catch (hata) {
      console.error('Kullanıcı bilgisi sorgulanırken hata oluştu:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Kullanıcı Sorgu Hatası')
        .setDescription('Belirtilen kullanıcının bilgileri alınırken bir hata oluştu.')
        .setColor('#e74c3c')
        .addFields({
          name: 'Hata Açıklaması',
          value: hata.response?.data?.errors?.[0]?.message || hata.message || 'Bilinmeyen hata oluştu',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  },

  async oyunBilgisiSorgula(interaction) {
    const oyunId = interaction.options.getString('oyun_id').trim();

    try {
      // Oyun detay bilgilerini sorgula
      const oyunDetayYaniti = await axios.get(`https://games.roblox.com/v1/games?universeIds=${oyunId}`);
      
      if (!oyunDetayYaniti.data.data || oyunDetayYaniti.data.data.length === 0) {
        const bulunamadiEmbed = new EmbedBuilder()
          .setTitle('Oyun Bulunamadı')
          .setDescription(`Kimlik numarası "${oyunId}" olan oyun bulunamadı.`)
          .setColor('#e74c3c')
          .addFields({
            name: 'Kontrol Edilecek Hususlar',
            value: '• Oyun kimlik numarasının doğru girildiğinden emin olunuz\n• Oyunun hala aktif olduğundan emin olunuz\n• Universe ID kullandığınızdan emin olunuz',
            inline: false
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [bulunamadiEmbed] });
      }

      const oyunVerisi = oyunDetayYaniti.data.data[0];

      // Oyun ikonu görselini sorgula
      let oyunIkonu = null;
      try {
        const ikonYaniti = await axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${oyunId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);
        oyunIkonu = ikonYaniti.data.data[0]?.imageUrl;
      } catch (hata) {
        console.warn('Oyun ikonu alınamadı:', hata.message);
      }

      // Oyun yaratıcısının detay bilgilerini sorgula
      let yaraticiDetayBilgisi = oyunVerisi.creator.name;
      try {
        if (oyunVerisi.creator.type === 'User') {
          const yaraticiYaniti = await axios.get(`https://users.roblox.com/v1/users/${oyunVerisi.creator.id}`);
          yaraticiDetayBilgisi = `${yaraticiYaniti.data.displayName} (@${yaraticiYaniti.data.name})`;
        } else if (oyunVerisi.creator.type === 'Group') {
          const grupYaniti = await axios.get(`https://groups.roblox.com/v1/groups/${oyunVerisi.creator.id}`);
          yaraticiDetayBilgisi = grupYaniti.data.name;
        }
      } catch (hata) {
        console.warn('Yaratıcı detay bilgisi alınamadı:', hata.message);
      }

      // Oyun yaşını hesapla
      const oyunOlusturmaTarihi = new Date(oyunVerisi.created);
      const oyunGuncellemeTarihi = new Date(oyunVerisi.updated);
      const guncelTarih = new Date();
      const oyunYasiGun = Math.floor((guncelTarih - oyunOlusturmaTarihi) / (1000 * 60 * 60 * 24));

      // Beğeni oranını hesapla
      const toplamOy = oyunVerisi.upVotes + oyunVerisi.downVotes;
      const begeniOrani = toplamOy > 0 ? ((oyunVerisi.upVotes / toplamOy) * 100).toFixed(1) : '0.0';

      const oyunEmbed = new EmbedBuilder()
        .setTitle(`${oyunVerisi.name} Oyun Bilgileri`)
        .setDescription(oyunVerisi.description || 'Bu oyun için henüz bir açıklama eklenmemiştir.')
        .setColor('#00ff00')
        .addFields(
          {
            name: 'Oyuncu İstatistikleri',
            value: `**Şu Anda Oynayan:** ${oyunVerisi.playing.toLocaleString('tr-TR')} kişi\n**Toplam Ziyaret Sayısı:** ${oyunVerisi.visits.toLocaleString('tr-TR')}\n**Favori Sayısı:** ${oyunVerisi.favoritedCount?.toLocaleString('tr-TR') || 'Bilinmiyor'}`,
            inline: true
          },
          {
            name: 'Değerlendirme İstatistikleri',
            value: `**Beğeni Sayısı:** ${oyunVerisi.upVotes.toLocaleString('tr-TR')}\n**Beğenmeme Sayısı:** ${oyunVerisi.downVotes.toLocaleString('tr-TR')}\n**Beğeni Oranı:** %${begeniOrani}\n**Toplam Oy:** ${toplamOy.toLocaleString('tr-TR')}`,
            inline: true
          },
          {
            name: 'Oyun Detay Bilgileri',
            value: `**Yaratıcı:** ${yaraticiDetayBilgisi}\n**Yaratıcı Türü:** ${oyunVerisi.creator.type === 'User' ? 'Kullanıcı' : 'Grup'}\n**Maksimum Oyuncu Kapasitesi:** ${oyunVerisi.maxPlayers} kişi\n**Oyun Türü:** ${oyunVerisi.genre || 'Belirtilmemiş'}`,
            inline: false
          },
          {
            name: 'Tarih Bilgileri',
            value: `**Oyun Oluşturma Tarihi:** <t:${Math.floor(oyunOlusturmaTarihi.getTime() / 1000)}:D>\n**Son Güncelleme Tarihi:** <t:${Math.floor(oyunGuncellemeTarihi.getTime() / 1000)}:D>\n**Oyun Yaşı:** ${oyunYasiGun.toLocaleString('tr-TR')} gün\n**Son Güncelleme:** <t:${Math.floor(oyunGuncellemeTarihi.getTime() / 1000)}:R>`,
            inline: false
          },
          {
            name: 'Teknik Bilgiler',
            value: `**Universe Kimlik Numarası:** ${oyunVerisi.id}\n**Root Place Kimlik Numarası:** ${oyunVerisi.rootPlaceId}\n**Oyun Durumu:** ${oyunVerisi.isGenreEnforced ? 'Tür Zorlamalı' : 'Serbest'}\n**Kopya Koruması:** ${oyunVerisi.copyingAllowed ? 'Pasif' : 'Aktif'}`,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Roblox Oyun Sorgu Sistemi • Sorgu Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
          iconURL: 'https://www.roblox.com/favicon.ico'
        });

      if (oyunIkonu) {
        oyunEmbed.setThumbnail(oyunIkonu);
      }

      // Etkileşim butonlarını oluştur
      const oyunOynaButonu = new ButtonBuilder()
        .setLabel('Oyunu Oyna')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/games/${oyunVerisi.rootPlaceId}`);

      const yaraticiGoruntuleButonu = new ButtonBuilder()
        .setLabel('Yaratıcıyı Görüntüle')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/${oyunVerisi.creator.type === 'User' ? 'users' : 'groups'}/${oyunVerisi.creator.id}`);

      const oyunDetayButonu = new ButtonBuilder()
        .setCustomId(`oyun_detay_${oyunId}`)
        .setLabel('Detaylı Oyun Bilgileri')
        .setStyle(ButtonStyle.Primary);

      const sunucuListesiButonu = new ButtonBuilder()
        .setCustomId(`sunucu_listesi_${oyunVerisi.rootPlaceId}`)
        .setLabel('Sunucu Listesini Görüntüle')
        .setStyle(ButtonStyle.Secondary);

      const butonSatiri = new ActionRowBuilder()
        .addComponents(oyunOynaButonu, yaraticiGoruntuleButonu, oyunDetayButonu, sunucuListesiButonu);

      await interaction.editReply({
        embeds: [oyunEmbed],
        components: [butonSatiri]
      });

    } catch (hata) {
      console.error('Oyun bilgisi sorgulanırken hata oluştu:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Oyun Sorgu Hatası')
        .setDescription('Belirtilen oyunun bilgileri alınırken bir hata oluştu.')
        .setColor('#e74c3c')
        .addFields({
          name: 'Hata Açıklaması',
          value: hata.response?.data?.errors?.[0]?.message || hata.message || 'Bilinmeyen hata oluştu',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  },

  async grupBilgisiSorgula(interaction) {
    const grupId = interaction.options.getString('grup_id').trim();

    try {
      // Grup detay bilgilerini sorgula
      const grupDetayYaniti = await axios.get(`https://groups.roblox.com/v1/groups/${grupId}`);
      const grupVerisi = grupDetayYaniti.data;

      // Grup ikonu görselini sorgula
      let grupIkonu = null;
      try {
        const ikonYaniti = await axios.get(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${grupId}&size=420x420&format=Png&isCircular=false`);
        grupIkonu = ikonYaniti.data.data[0]?.imageUrl;
      } catch (hata) {
        console.warn('Grup ikonu alınamadı:', hata.message);
      }

      // Grup rollerini sorgula
      let rolSayisi = 'Bilinmiyor';
      try {
        const rolYaniti = await axios.get(`https://groups.roblox.com/v1/groups/${grupId}/roles`);
        rolSayisi = rolYaniti.data.roles?.length || 'Bilinmiyor';
      } catch (hata) {
        console.warn('Grup rolleri alınamadı:', hata.message);
      }

      const grupEmbed = new EmbedBuilder()
        .setTitle(`${grupVerisi.name} Grup Bilgileri`)
        .setDescription(grupVerisi.description || 'Bu grup için henüz bir açıklama eklenmemiştir.')
        .setColor('#ff6b00')
        .addFields(
          {
            name: 'Temel Grup İstatistikleri',
            value: `**Toplam Üye Sayısı:** ${grupVerisi.memberCount.toLocaleString('tr-TR')} kişi\n**Grup Sahibi:** ${grupVerisi.owner ? grupVerisi.owner.displayName : 'Sahip Bulunmuyor'}\n**Rol Sayısı:** ${rolSayisi}\n**Grup Kimlik Numarası:** ${grupVerisi.id}`,
            inline: true
          },
          {
            name: 'Grup Ayarları ve Durumu',
            value: `**Herkese Açık Katılım:** ${grupVerisi.publicEntryAllowed ? 'Evet' : 'Hayır'}\n**Doğrulanmış Grup:** ${grupVerisi.hasVerifiedBadge ? 'Evet' : 'Hayır'}\n**Premium Avantajları:** ${grupVerisi.hasPremiumBenefits ? 'Aktif' : 'Pasif'}\n**Grup Durumu:** Aktif`,
            inline: true
          },
          {
            name: 'Ek Grup Bilgileri',
            value: `**Grup Türü:** ${grupVerisi.publicEntryAllowed ? 'Açık Grup' : 'Kapalı Grup'}\n**Üyelik Onayı:** ${grupVerisi.publicEntryAllowed ? 'Gerekli Değil' : 'Gerekli'}\n**Grup Yaşı:** Hesaplanamadı\n**Son Aktivite:** Bilinmiyor`,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Roblox Grup Sorgu Sistemi • Sorgu Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
          iconURL: 'https://www.roblox.com/favicon.ico'
        });

      if (grupIkonu) {
        grupEmbed.setThumbnail(grupIkonu);
      }

      // Etkileşim butonlarını oluştur
      const grupGoruntuleButonu = new ButtonBuilder()
        .setLabel('Roblox Grubunu Görüntüle')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/groups/${grupId}`);

      const uyeListesiButonu = new ButtonBuilder()
        .setCustomId(`uye_listesi_${grupId}`)
        .setLabel('Üye Listesini Görüntüle')
        .setStyle(ButtonStyle.Primary);

      const rolListesiButonu = new ButtonBuilder()
        .setCustomId(`rol_listesi_${grupId}`)
        .setLabel('Rol Listesini Görüntüle')
        .setStyle(ButtonStyle.Secondary);

      const grupOyunlariButonu = new ButtonBuilder()
        .setCustomId(`grup_oyunlari_${grupId}`)
        .setLabel('Grup Oyunlarını Görüntüle')
        .setStyle(ButtonStyle.Success);

      const butonSatiri = new ActionRowBuilder()
        .addComponents(grupGoruntuleButonu, uyeListesiButonu, rolListesiButonu, grupOyunlariButonu);

      await interaction.editReply({
        embeds: [grupEmbed],
        components: [butonSatiri]
      });

    } catch (hata) {
      console.error('Grup bilgisi sorgulanırken hata oluştu:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Grup Sorgu Hatası')
        .setDescription('Belirtilen grubun bilgileri alınırken bir hata oluştu. Grup kimlik numarasının doğru olduğundan emin olunuz.')
        .setColor('#e74c3c')
        .addFields({
          name: 'Hata Açıklaması',
          value: hata.response?.data?.errors?.[0]?.message || hata.message || 'Bilinmeyen hata oluştu',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  },

  async avatarBilgisiSorgula(interaction) {
    const kullaniciAdi = interaction.options.getString('kullanici_adi').trim();

    try {
      // Kullanıcı kimlik numarasını sorgula
      const kullaniciAramaYaniti = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [kullaniciAdi]
      });

      if (!kullaniciAramaY
