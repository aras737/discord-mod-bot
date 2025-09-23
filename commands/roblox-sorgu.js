const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Roblox platformunda kullanıcı, oyun ve grup bilgilerini detaylı olarak sorgular')
    .addSubcommand(subcommand =>
      subcommand
        .setName('kullanici')
        .setDescription('Belirtilen Roblox kullanıcısının profil ve grup bilgilerini görüntüler')
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
            value: 'İnternet bağlantınızı kontrol ediniz\nGirdiğiniz bilgilerin doğruluğunu kontrol ediniz\nBirkaç dakika sonra tekrar deneyiniz',
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
            value: 'Kullanıcı adının doğru yazıldığından emin olunuz\nBüyük küçük harf duyarlılığını kontrol ediniz\nKullanıcının hesabının aktif olduğundan emin olunuz',
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

      // Kullanıcının gruplarını sorgula
      let grupBilgileri = 'Bu kullanıcı herhangi bir gruba üye değildir.';
      try {
        const grupYaniti = await axios.get(`https://groups.roblox.com/v2/users/${kullaniciId}/groups/roles`);
        const gruplar = grupYaniti.data.data;

        if (gruplar && gruplar.length > 0) {
          let grupListesi = '';
          const maksimumGrup = Math.min(gruplar.length, 10); // En fazla 10 grup göster

          for (let i = 0; i < maksimumGrup; i++) {
            const grup = gruplar[i];
            const grupAdi = grup.group.name;
            const rutbe = grup.role.name;
            const rutbeId = grup.role.rank;
            
            // Katılım tarihini almaya çalış
            let katilimTarihi = 'Bilinmiyor';
            try {
              // Not: Roblox API'si katılım tarihini doğrudan vermez, bu bilgi sınırlıdır
              katilimTarihi = 'API Sınırlaması';
            } catch (e) {
              katilimTarihi = 'Alınamadı';
            }

            grupListesi += `**${grupAdi}**\n`;
            grupListesi += `Rütbe: ${rutbe} (${rutbeId})\n`;
            grupListesi += `Katılım: ${katilimTarihi}\n`;
            grupListesi += `Grup ID: ${grup.group.id}\n\n`;
          }

          if (gruplar.length > 10) {
            grupListesi += `Ve ${gruplar.length - 10} grup daha...`;
          }

          grupBilgileri = grupListesi;
        }
      } catch (hata) {
        console.warn('Grup bilgileri alınamadı:', hata.message);
        grupBilgileri = 'Grup bilgileri alınırken hata oluştu.';
      }

      // Hesap yaşını hesapla
      const hesapOlusturmaTarihi = new Date(kullaniciVerisi.created);
      const guncelTarih = new Date();
      const hesapYasiGun = Math.floor((guncelTarih - hesapOlusturmaTarihi) / (1000 * 60 * 60 * 24));
      const hesapYasiYil = Math.floor(hesapYasiGun / 365);
      const hesapYasiAy = Math.floor((hesapYasiGun % 365) / 30);

      // Kullanıcı durumunu sorgula
      let kullaniciDurumu = 'Bilinmiyor';
      let oynadigiOyun = 'Oyun Oynamıyor';
      try {
        const durumYaniti = await axios.get(`https://presence.roblox.com/v1/presence/users`, {
          params: { userIds: kullaniciId }
        });
        const durumBilgisi = durumYaniti.data.userPresences[0];
        if (durumBilgisi) {
          switch (durumBilgisi.userPresenceType) {
            case 0: kullaniciDurumu = 'Çevrimdışı'; break;
            case 1: kullaniciDurumu = 'Çevrimiçi'; break;
            case 2: 
              kullaniciDurumu = 'Oyun Oynuyor'; 
              oynadigiOyun = durumBilgisi.lastLocation || 'Bilinmeyen Oyun';
              break;
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
            value: `**Kullanıcı ID:** ${kullaniciVerisi.id}\n**Kullanıcı Adı:** ${kullaniciVerisi.name}\n**Görünen Ad:** ${kullaniciVerisi.displayName}\n**Durum:** ${kullaniciDurumu}\n**Oynadığı Oyun:** ${oynadigiOyun}`,
            inline: false
          },
          {
            name: 'Sosyal Medya İstatistikleri',
            value: `**Arkadaş Sayısı:** ${arkadasSayisi}\n**Takipçi Sayısı:** ${takipciSayisi}\n**Takip Edilen:** ${takipEdilenSayisi}`,
            inline: true
          },
          {
            name: 'Hesap Detay Bilgileri',
            value: `**Oluşturma Tarihi:** <t:${Math.floor(hesapOlusturmaTarihi.getTime() / 1000)}:D>\n**Hesap Yaşı:** ${hesapYasiYil} yıl ${hesapYasiAy} ay\n**Toplam Gün:** ${hesapYasiGun.toLocaleString('tr-TR')}\n**Doğrulanmış:** ${kullaniciVerisi.hasVerifiedBadge ? 'Evet' : 'Hayır'}\n**Premium:** ${kullaniciVerisi.isPremium ? 'Aktif' : 'Pasif'}`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Roblox Kullanıcı Sorgu Sistemi • ${new Date().toLocaleDateString('tr-TR')}`,
          iconURL: 'https://www.roblox.com/favicon.ico'
        });

      if (avatarUrl) {
        kullaniciEmbed.setThumbnail(avatarUrl);
      }

      // Grup bilgilerini ayrı bir embed olarak ekle
      const grupEmbed = new EmbedBuilder()
        .setTitle(`${kullaniciVerisi.displayName} Grup Üyelikleri`)
        .setDescription(grupBilgileri)
        .setColor('#ff6b00')
        .setTimestamp()
        .setFooter({
          text: 'Roblox Grup Bilgileri'
        });

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

      const grupDetayButonu = new ButtonBuilder()
        .setCustomId(`grup_detay_${kullaniciId}`)
        .setLabel('Detaylı Grup Bilgileri')
        .setStyle(ButtonStyle.Success);

      const butonSatiri = new ActionRowBuilder()
        .addComponents(profilGoruntuleButonu, oyunlarGoruntuleButonu, avatarGoruntuleButonu, grupDetayButonu);

      await interaction.editReply({
        embeds: [kullaniciEmbed, grupEmbed],
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
            value: 'Oyun kimlik numarasının doğru girildiğinden emin olunuz\nOyunun hala aktif olduğundan emin olunuz\nUniverse ID kullandığınızdan emin olunuz',
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
            value: `**Şu Anda Oynayan:** ${oyunVerisi.playing.toLocaleString('tr-TR')} kişi\n**Toplam Ziyaret:** ${oyunVerisi.visits.toLocaleString('tr-TR')}\n**Favori Sayısı:** ${oyunVerisi.favoritedCount?.toLocaleString('tr-TR') || 'Bilinmiyor'}`,
            inline: true
          },
          {
            name: 'Değerlendirme İstatistikleri',
            value: `**Beğeni:** ${oyunVerisi.upVotes.toLocaleString('tr-TR')}\n**Beğenmeme:** ${oyunVerisi.downVotes.toLocaleString('tr-TR')}\n**Beğeni Oranı:** %${begeniOrani}`,
            inline: true
          },
          {
            name: 'Oyun Detayları',
            value: `**Yaratıcı:** ${oyunVerisi.creator.name}\n**Yaratıcı Türü:** ${oyunVerisi.creator.type === 'User' ? 'Kullanıcı' : 'Grup'}\n**Maksimum Oyuncu:** ${oyunVerisi.maxPlayers}\n**Oluşturma:** <t:${Math.floor(new Date(oyunVerisi.created).getTime() / 1000)}:D>\n**Güncelleme:** <t:${Math.floor(new Date(oyunVerisi.updated).getTime() / 1000)}:R>`,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: 'Roblox Oyun Sorgu Sistemi'
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

      const butonSatiri = new ActionRowBuilder()
        .addComponents(oyunOynaButonu, yaraticiGoruntuleButonu);

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

      const grupEmbed = new EmbedBuilder()
        .setTitle(`${grupVerisi.name} Grup Bilgileri`)
        .setDescription(grupVerisi.description || 'Bu grup için henüz bir açıklama eklenmemiştir.')
        .setColor('#ff6b00')
        .addFields(
          {
            name: 'Grup İstatistikleri',
            value: `**Üye Sayısı:** ${grupVerisi.memberCount.toLocaleString('tr-TR')}\n**Sahip:** ${grupVerisi.owner ? grupVerisi.owner.displayName : 'Sahip Yok'}\n**Herkese Açık:** ${grupVerisi.publicEntryAllowed ? 'Evet' : 'Hayır'}`,
            inline: true
          },
          {
            name: 'Grup Özellikleri',
            value: `**Grup ID:** ${grupVerisi.id}\n**Doğrulanmış:** ${grupVerisi.hasVerifiedBadge ? 'Evet' : 'Hayır'}\n**Premium:** ${grupVerisi.hasPremiumBenefits ? 'Aktif' : 'Pasif'}`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: 'Roblox Grup Sorgu Sistemi'
        });

      if (grupIkonu) {
        grupEmbed.setThumbnail(grupIkonu);
      }

      // Etkileşim butonlarını oluştur
      const grupGoruntuleButonu = new ButtonBuilder()
        .setLabel('Grubu Görüntüle')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/groups/${grupId}`);

      const butonSatiri = new ActionRowBuilder()
        .addComponents(grupGoruntuleButonu);

      await interaction.editReply({
        embeds: [grupEmbed],
        components: [butonSatiri]
      });

    } catch (hata) {
      console.error('Grup bilgisi sorgulanırken hata oluştu:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Grup Sorgu Hatası')
        .setDescription('Belirtilen grubun bilgileri alınırken bir hata oluştu.')
        .setColor('#e74c3c')
        .setTimestamp();

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  }
};
