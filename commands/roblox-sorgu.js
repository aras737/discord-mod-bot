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
    ),  // Bu parantez, data tanımının kapanışı; alt komutların arasında fazladan virgül yok.

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

      const kullaniciDetayYaniti = await axios.get(`https://users.roblox.com/v1/users/${kullaniciId}`);
      const kullaniciVerisi = kullaniciDetayYaniti.data;

      const avatarYaniti = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${kullaniciId}&size=420x420&format=Png&isCircular=false`);
      const avatarUrl = avatarYaniti.data.data[0]?.imageUrl || null;

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

      const hesapOlusturmaTarihi = new Date(kullaniciVerisi.created);
      const guncelTarih = new Date();
      const hesapYasiGun = Math.floor((guncelTarih - hesapOlusturmaTarihi) / (1000 * 60 * 60 * 24));
      const hesapYasiYil = Math.floor(hesapYasiGun / 365);
      const hesapYasiAy = Math.floor((hesapYasiGun % 365) / 30);

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
        .setDescription(kullaniciVerisi.description || 'Bu kullanıcı henüz bir profil açıklaması eklememiştir.')
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

      const profilGoruntuleButonu = new ButtonBuilder()
        .setLabel('Roblox Profilini Görüntüle')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/users/${kullaniciId}/profile`);

      const butonSatiri = new ActionRowBuilder()
        .addComponents(profilGoruntuleButonu);

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
    // ... Kodun bu kısmı senin verdiğin düzeltmeler gibi kalabilir, ben hata gelmeyen kısmını değiştirmedim
  },

  async grupBilgisiSorgula(interaction) {
    // ... Aynı şekilde
  },

  async avatarBilgisiSorgula(interaction) {
    const kullaniciAdi = interaction.options.getString('kullanici_adi').trim();

    try {
      const kullaniciAramaYaniti = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [kullaniciAdi]
      });

      if (!kullaniciAramaYaniti.data.data || kullaniciAramaYaniti.data.data.length === 0) {
        const bulunamadiEmbed = new EmbedBuilder()
          .setTitle('Kullanıcı Bulunamadı')
          .setDescription(`"${kullaniciAdi}" adlı kullanıcı bulunamadı.`)
          .setColor('#e74c3c')
          .setTimestamp();

        return await interaction.editReply({ embeds: [bulunamadiEmbed] });
      }

      const kullaniciId = kullaniciAramaYaniti.data.data[0].id;

      const avatarYaniti = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${kullaniciId}&size=720x720&format=Png&isCircular=false`);
      const avatarUrl = avatarYaniti.data.data[0]?.imageUrl || null;

      const avatarEmbed = new EmbedBuilder()
        .setTitle(`Avatar Bilgisi: ${kullaniciAdi}`)
        .setColor('#00b2ff')
        .setTimestamp()
        .setFooter({
          text: 'Roblox Avatar Bilgi',
          iconURL: 'https://www.roblox.com/favicon.ico'
        });

      if (avatarUrl) {
        avatarEmbed.setImage(avatarUrl);
      } else {
        avatarEmbed.setDescription('Avatar resmi alınamadı.');
      }

      await interaction.editReply({ embeds: [avatarEmbed] });

    } catch (hata) {
      console.error('Avatar bilgisi sorgulanırken hata oluştu:', hata);

      const hataEmbed = new EmbedBuilder()
        .setTitle('Avatar Sorgu Hatası')
        .setDescription('Avatar bilgileri alınırken bir hata oluştu.')
        .setColor('#e74c3c')
        .addFields({
          name: 'Hata Açıklaması',
          value: hata.response?.data?.errors?.[0]?.message || hata.message || 'Bilinmeyen hata oluştu',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [hataEmbed] });
    }
  }
};
