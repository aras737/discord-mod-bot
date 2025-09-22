const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Profesyonel duyuru gönderir ve herkesi etiketler')
    .addStringOption(option =>
      option.setName('baslik')
        .setDescription('Duyuru başlığını girin')
        .setRequired(true)
        .setMaxLength(256)
    )
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Duyuru mesaj içeriğini girin')
        .setRequired(true)
        .setMaxLength(4000)
    )
    .addStringOption(option =>
      option.setName('oncelik')
        .setDescription('Duyuru öncelik seviyesini seçin')
        .setRequired(false)
        .addChoices(
          { name: 'Düşük Öncelik', value: 'dusuk' },
          { name: 'Orta Öncelik', value: 'orta' },
          { name: 'Yüksek Öncelik', value: 'yuksek' },
          { name: 'Kritik', value: 'kritik' }
        )
    )
    .addBooleanOption(option =>
      option.setName('herkesi_etiketle')
        .setDescription('Bu duyuruda herkesi etiketlemek istiyor musunuz')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    try {
      // Kullanıcının uygun yetkisi olup olmadığını kontrol et
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return await interaction.reply({
          content: 'Duyuru gönderme yetkiniz bulunmamaktadır. Gerekli yetki: Mesajları Yönet',
          ephemeral: true
        });
      }

      const baslik = interaction.options.getString('baslik');
      const mesaj = interaction.options.getString('mesaj');
      const oncelik = interaction.options.getString('oncelik') || 'orta';
      const herkesiEtiketle = interaction.options.getBoolean('herkesi_etiketle') ?? true;

      // Öncelik yapılandırmalarını tanımla
      const oncelikYapisi = {
        dusuk: {
          renk: '#95a5a6',
          etiket: 'Düşük Öncelik',
          ikon: '🔵'
        },
        orta: {
          renk: '#f39c12',
          etiket: 'Orta Öncelik',
          ikon: '🟡'
        },
        yuksek: {
          renk: '#e74c3c',
          etiket: 'Yüksek Öncelik',
          ikon: '🔴'
        },
        kritik: {
          renk: '#8b0000',
          etiket: 'Kritik Uyarı',
          ikon: '🚨'
        }
      };

      const yapilandirma = oncelikYapisi[oncelik];

      // Duyuru embed'ini oluştur
      const duyuruEmbed = new EmbedBuilder()
        .setTitle(`${yapilandirma.ikon} ${baslik}`)
        .setDescription(mesaj)
        .setColor(yapilandirma.renk)
        .addFields(
          {
            name: 'Öncelik Seviyesi',
            value: yapilandirma.etiket,
            inline: true
          },
          {
            name: 'Duyuran Kişi',
            value: `${interaction.user.tag}`,
            inline: true
          },
          {
            name: 'Sunucu',
            value: `${interaction.guild.name}`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Duyuru Kimliği: ${interaction.id}`,
          iconURL: interaction.guild.iconURL()
        });

      // Eylem butonlarını oluştur
      const okuduButonu = new ButtonBuilder()
        .setCustomId(`okudum_${interaction.id}`)
        .setLabel('Okudum İşaretle')
        .setStyle(ButtonStyle.Success);

      const onemliButonu = new ButtonBuilder()
        .setCustomId(`onemli_${interaction.id}`)
        .setLabel('Önemli İşaretle')
        .setStyle(ButtonStyle.Primary);

      const paylasButonu = new ButtonBuilder()
        .setCustomId(`paylas_${interaction.id}`)
        .setLabel('Duyuruyu Paylaş')
        .setStyle(ButtonStyle.Secondary);

      const eylemSatiri = new ActionRowBuilder()
        .addComponents(okuduButonu, onemliButonu, paylasButonu);

      // Yanıt içeriğini hazırla
      let yanitIcerigi = '';
      if (herkesiEtiketle) {
        yanitIcerigi = '@everyone\n\n**Yeni Sunucu Duyurusu**';
      } else {
        yanitIcerigi = '**Yeni Sunucu Duyurusu**';
      }

      // Duyuruyu gönder
      await interaction.reply({
        content: yanitIcerigi,
        embeds: [duyuruEmbed],
        components: [eylemSatiri]
      });

      // Duyuruyu konsola kaydet
      console.log(`${interaction.user.tag} tarafından ${interaction.guild.name} sunucusunda duyuru gönderildi: ${baslik}`);

    } catch (hata) {
      console.error('Duyuru komutu çalıştırılırken hata oluştu:', hata);
      
      const hataEmbed = new EmbedBuilder()
        .setTitle('Komut Hatası')
        .setDescription('Duyurunuz işlenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
        .setColor('#e74c3c')
        .setTimestamp();

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [hataEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [hataEmbed], ephemeral: true });
      }
    }
  },

  // Buton etkileşimlerini yönet
  async butonEtkilesiminiYonet(interaction) {
    if (!interaction.isButton()) return;

    const [eylem, duyuruKimligi] = interaction.customId.split('_');

    try {
      switch (eylem) {
        case 'okudum':
          await interaction.reply({
            content: 'Bu duyuruyu okundu olarak işaretlediniz. İlginiz için teşekkür ederiz.',
            ephemeral: true
          });
          break;

        case 'onemli':
          await interaction.reply({
            content: 'Bu duyuruyu önemli olarak işaretlediniz. Önemli mesajlarınıza kaydedilecektir.',
            ephemeral: true
          });
          break;

        case 'paylas':
          const paylasEmbed = new EmbedBuilder()
            .setTitle('Duyuruyu Paylaş')
            .setDescription('Bu duyuruyu mesaj bağlantısını kopyalayarak veya diğer kanallarda bahsederek paylaşabilirsiniz.')
            .setColor('#3498db')
            .addFields({
              name: 'Mesaj Bağlantısı',
              value: `[Duyuruyu görüntülemek için tıklayın](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.id})`
            });

          await interaction.reply({
            embeds: [paylasEmbed],
            ephemeral: true
          });
          break;

        default:
          await interaction.reply({
            content: 'Bilinmeyen eylem. Lütfen tekrar deneyin.',
            ephemeral: true
          });
      }
    } catch (hata) {
      console.error('Buton etkileşimi yönetilirken hata oluştu:', hata);
      await interaction.reply({
        content: 'İsteğiniz işlenirken bir hata oluştu.',
        ephemeral: true
      });
    }
  }
};
