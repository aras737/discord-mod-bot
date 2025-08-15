// commands/kilavuz.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');

const CONFIG = (() => {
  try { return require('../config.json'); } catch { return {}; }
})();

module.exports = {
  // /kilavuz
  data: new SlashCommandBuilder()
    .setName('kilavuz')
    .setDescription('Sınır Müfettişleri alım kılavuzunu seçerek hazırla ve DM ile dosya olarak al.')
    .setDMPermission(false),

  // UST rütbeye sınırsız erişim zaten index’te veriliyor.
  // Bu komutu herkes kullanabilsin istiyorsan minRank tanımlama.
  async execute(interaction) {
    // İlk mesaj (ephemeral uyarısını yaşamamak için flags: 64 kullanıyoruz)
    const intro = new EmbedBuilder()
      .setTitle('📘 Alım Kılavuzu Oluşturucu')
      .setDescription(
        'Aşağıdan **branş** ve **birim** seç, sonra **Formu Aç** ile aday bilgilerini gir.\n' +
        'Son adımda kılavuz otomatik hazırlanıp **DM** olarak sana dosya gönderilecek.'
      )
      .setColor(0x3b82f6);

    // Branş seçimi (genişletilebilir)
    const branşMenu = new StringSelectMenuBuilder()
      .setCustomId(`kilavuz_branş_${interaction.id}`)
      .setPlaceholder('Branş seç (zorunlu)')
      .addOptions([
        { label: 'Sınır Müfettişleri', value: 'sm', description: 'Sınır Müfettişleri Branşı' },
        // { label: 'Başka Branş', value: 'baska' },
      ]);

    // Birim seçimi
    const birimMenu = new StringSelectMenuBuilder()
      .setCustomId(`kilavuz_birim_${interaction.id}`)
      .setPlaceholder('Birim seç (zorunlu)')
      .addOptions([
        { label: 'Gardiyan & Muhafız (GM)', value: 'gm' },
        { label: 'Denetim Birimi (DB)', value: 'db' },
      ]);

    const formButton = new ButtonBuilder()
      .setCustomId(`kilavuz_form_${interaction.id}`)
      .setLabel('📝 Formu Aç')
      .setStyle(ButtonStyle.Primary);

    const createButton = new ButtonBuilder()
      .setCustomId(`kilavuz_olustur_${interaction.id}`)
      .setLabel('📄 Kılavuzu Oluştur & DM Gönder')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true); // form doldurulmadan kapalı

    await interaction.reply({
      embeds: [intro],
      components: [
        new ActionRowBuilder().addComponents(branşMenu),
        new ActionRowBuilder().addComponents(birimMenu),
        new ActionRowBuilder().addComponents(formButton, createButton),
      ],
      flags: 64, // ephemeral
    });

    // Durum değişkenleri (kolektör içinde tutulacak)
    const state = {
      branş: null,
      birim: null,
      form: {
        adayAd: null,
        adayRoblox: null,
        yetkiliAd: interaction.user.tag,
      },
    };

    const msg = await interaction.fetchReply();

    // Komponent kolektörü (sadece komutu kullanan kişi etkileşebilsin)
    const collector = msg.createMessageComponentCollector({
      time: 5 * 60 * 1000,
      filter: i => i.user.id === interaction.user.id,
    });

    collector.on('collect', async (i) => {
      // Branş seçildi
      if (i.customId === `kilavuz_branş_${interaction.id}`) {
        state.branş = i.values[0];
        await i.update({
          components: [
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder(branşMenu.toJSON()).setDefaultValue(state.branş)
            ),
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder(birimMenu.toJSON()).setDefaultValue(state.birim ?? undefined)
            ),
            new ActionRowBuilder().addComponents(
              formButton,
              new ButtonBuilder(createButton.toJSON()).setDisabled(!isReadyToCreate(state))
            ),
          ],
        });
        return;
      }

      // Birim seçildi
      if (i.customId === `kilavuz_birim_${interaction.id}`) {
        state.birim = i.values[0];
        await i.update({
          components: [
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder(branşMenu.toJSON()).setDefaultValue(state.branş ?? undefined)
            ),
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder(birimMenu.toJSON()).setDefaultValue(state.birim)
            ),
            new ActionRowBuilder().addComponents(
              formButton,
              new ButtonBuilder(createButton.toJSON()).setDisabled(!isReadyToCreate(state))
            ),
          ],
        });
        return;
      }

      // Formu Aç (Modal)
      if (i.customId === `kilavuz_form_${interaction.id}`) {
        if (!state.branş || !state.birim) {
          return i.reply({ content: '⚠️ Önce **branş** ve **birim** seçmelisin.', flags: 64 });
        }

        const modal = new ModalBuilder()
          .setCustomId(`kilavuz_modal_${interaction.id}`)
          .setTitle('Aday Bilgileri');

        const adayAd = new TextInputBuilder()
          .setCustomId('adayAd')
          .setLabel('Adayın Adı (Discord gösterim adı)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const adayRoblox = new TextInputBuilder()
          .setCustomId('adayRoblox')
          .setLabel('Adayın Roblox Kullanıcı Adı')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(adayAd),
          new ActionRowBuilder().addComponents(adayRoblox),
        );

        await i.showModal(modal);

        // Modal submit bekle
        try {
          const submitted = await i.awaitModalSubmit({
            time: 2 * 60 * 1000,
            filter: m => m.customId === `kilavuz_modal_${interaction.id}` && m.user.id === interaction.user.id,
          });

          state.form.adayAd = submitted.fields.getTextInputValue('adayAd');
          state.form.adayRoblox = submitted.fields.getTextInputValue('adayRoblox');

          await submitted.reply({ content: '✅ Form kaydedildi. Artık kılavuzu oluşturabilirsin.', flags: 64 });

          // Ana mesajdaki “Oluştur” butonunu aktif et
          await interaction.editReply({
            components: [
              new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder(branşMenu.toJSON()).setDefaultValue(state.branş)
              ),
              new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder(birimMenu.toJSON()).setDefaultValue(state.birim)
              ),
              new ActionRowBuilder().addComponents(
                formButton,
                new ButtonBuilder(createButton.toJSON()).setDisabled(!isReadyToCreate(state)) // artık aktif
              ),
            ],
          });
        } catch {
          // modal süresi doldu vs.
        }
        return;
      }

      // Kılavuz oluştur & DM gönder
      if (i.customId === `kilavuz_olustur_${interaction.id}`) {
        if (!isReadyToCreate(state)) {
          return i.reply({ content: '⚠️ Branş, birim ve form bilgileri eksik.', flags: 64 });
        }

        // İçerik üret
        const icerik = buildGuide(state, interaction);

        // Dosya ek olarak hazırla (fs’siz, Buffer ile)
        const file = new AttachmentBuilder(Buffer.from(icerik, 'utf-8'), { name: 'SM_Alim_Kilavuzu.txt' });

        // DM gönder
        let dmOK = true;
        try {
          await interaction.user.send({
            content: '📩 **Sınır Müfettişleri Alım Kılavuzun** hazır! Dosya ektedir.',
            files: [file],
          });
        } catch {
          dmOK = false;
        }

        // Log kanalına bilgi (isteğe bağlı)
        const logId = CONFIG.logChannelId;
        if (logId) {
          const ch = interaction.guild.channels.cache.get(logId);
          if (ch) {
            ch.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle('📘 Kılavuz Oluşturuldu')
                  .setDescription(
                    `**Yetkili:** ${interaction.user}\n` +
                    `**Branş:** ${humanBrans(state.branş)}\n**Birim:** ${humanBirim(state.birim)}\n` +
                    `**Aday:** \`${state.form.adayAd}\` / \`${state.form.adayRoblox}\``
                  )
                  .setColor(0x22c55e)
                  .setTimestamp(),
              ],
            }).catch(() => {});
          }
        }

        await i.reply({
          content: dmOK
            ? '✅ Kılavuz oluşturuldu ve **DM** olarak gönderildi.'
            : '⚠️ DM gönderilemedi (kullanıcı DM kapalı). Dosya burada:',
          files: dmOK ? [] : [file],
          flags: 64,
        });

        collector.stop('done');
        return;
      }
    });

    collector.on('end', async (_c, reason) => {
      // Butonları/menüleri kilitle
      if (reason !== 'done') {
        try {
          await interaction.editReply({
            components: disableAll(interaction, branşMenu, birimMenu, formButton, createButton),
          });
        } catch {}
      } else {
        try {
          await interaction.editReply({
            components: disableAll(interaction, branşMenu, birimMenu, formButton, createButton),
          });
        } catch {}
      }
    });
  },
};

// === Yardımcılar ===
function isReadyToCreate(state) {
  return !!(state.branş && state.birim && state.form.adayAd && state.form.adayRoblox);
}

function humanBrans(v) {
  if (v === 'sm') return 'Sınır Müfettişleri';
  return v;
}
function humanBirim(v) {
  if (v === 'gm') return 'Gardiyan & Muhafız (GM)';
  if (v === 'db') return 'Denetim Birimi (DB)';
  return v;
}

function disableAll(interaction, branşMenu, birimMenu, formBtn, createBtn) {
  return [
    new ActionRowBuilder().addComponents(new StringSelectMenuBuilder(branşMenu.toJSON()).setDisabled(true)),
    new ActionRowBuilder().addComponents(new StringSelectMenuBuilder(birimMenu.toJSON()).setDisabled(true)),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder(formBtn.toJSON()).setDisabled(true),
      new ButtonBuilder(createBtn.toJSON()).setDisabled(true)
    ),
  ];
}

function buildGuide(state, interaction) {
  const br = humanBrans(state.branş);
  const bi = humanBirim(state.birim);
  const yetkili = interaction.user.tag;
  const adayAd = state.form.adayAd;
  const adayRb = state.form.adayRoblox;

  // Burada verdiğin uzun metni düzenli bir şablonla birleştiriyoruz.
  // İstersen dosya uzantısını .md yapıp daha okunaklı kullanabilirsin.
  return `Sınır Müfettişleri Alım Kılavuzu
==================================

Hazırlayan Yetkili : ${yetkili}
Branş              : ${br}
Birim              : ${bi}
Aday (Discord)     : ${adayAd}
Aday (Roblox)      : ${adayRb}

ÖNEMLİ NOT:
- Bu doküman, Discord komutu /kilavuz ile otomatik oluşturulmuştur.
- TA Discord: https://discord.gg/taf

----------------------------------
ALIM POLİTİKASI / GENEL AKIŞ
----------------------------------
Alım için herhangi bir izin almanıza gerek yoktur. Sunucuda boş bir pad’in önüne geçin ve alıma başlayın.
Bulunduğunuz paddeki duyuru atma tuşuna basınız ve oradan “Sınır Müfettişleri” branşını seçiniz ve duyuru atınız.

Not: Sakın “:n” ile duyuru atmayın. Atan personeller tenzil (demote) yiyecektir.

TEMEL ŞARTLAR
- Hesap yaşı 50+ gün olmalıdır. (50 gün altı kesinlikle kabul edilemez.)
- TSK Rütbesi OR-2+ olmalıdır.
- Herhangi başka bir askeri grupta bulunmamalıdır. (İttifak olduğumuz gruplar hariç.)
- Hesabı -13 olmamalıdır.
- Discord hesabı olmalıdır.
- Başka bir branşta olmamalıdır. (Kişinin profiline girerek gruplarından kontrol ediniz.)
- Sınır Müfettişleri kara listesinde olmamalıdır. (DC üzerinden “#karaliste” kontrolü yapınız.)
- TA Discord sunucusunda /verify yapmış olmalı. (TA DC üzerinden katılımcıyı etiketlemeyi deneyerek kontrol edebilirsiniz.)

1) Kendini Tanıt & Kuralları Anlat
"Merhaba, ben Başmüfettiş (İsim). Sınır Müfettişleri alımını ben gerçekleştireceğim. Alım boyunca bana 'Başmüfettişim' diye hitap edeceksiniz. K.İ almadan konuşmak yasaktır. Dilerseniz başlayalım."

2) Temel Şart Kontrolleri
- :profile (isim) ile profil kontrolü (Safe Chat = Kapalı, Grup durumu = Temiz, 50+ gün)
- SM DC “#karaliste” kontrolü
- BL gruplar ve başka branş kontrolü
- Şartları karşılamayan veya BL’de olan aday alımdan atılır.

3) Jackler
"5 JJ 5 GJ 1 HJ Başla!"
- Atlama yapan uyarılır; devam ederse alımdan atılır.
- Mobil/yavaş çekenlere kolaylaştırma yapılabilir.
- HJ bilmeyenlere öğretilir.

4) Dönmeler
- Temel dönmeler yaptırılır (en fazla 10 komut).
- Toplamda 3 yanlış yapan elenir.
- Her hatada doğrusunu göster.

5) Formasyonlar
- SFL, Wedge, Sağ Kanat, Sol Kanat, STS
- Sırayla ve doğru yapılması gerekir.
- Öğretmene rağmen hala hatalıysa elenebilir.

6) Dil Bilgisi Testi
Adaylara 3 hata cümlesi verip /w ile düzeltilmesi istenir:
- "komutanım rütbem verildimi" → "Komutanım, rütbem verildi mi?"
- "komutanım gelirmisiniz" → "Komutanım, gelir misiniz?"
- "hiçbirşey beni durduramaz" → "Hiçbir şey beni durduramaz!"
- "paşam denetim varmı" → "Paşam, denetim var mı?"
- "paşam nasılsınız" → "Paşam, nasılsınız?"
İki yanlış yapan elenir. Doğruları gösterilir.

7) Tanıtım & Takım
- ":team (katılımcının tam ismi) Sınır"
- Reset çekilir, STS yapılır.

ÜNİFORMA / KIYAFET
- Zorunlu yüz: "Not Sure If..."
- SM LR üniforması: Öğrenci, Müfettişler, Stajyer (görev: eğitim & kabin)
- SM MR üniforması: Baş Müfettiş Adayı ~ Kıdemli Baş Müfettiş (alım/eğitim, "Başmüfettişim" hitabı)
- SM Tören üniforması: LR-MR, sadece Genel Branş Denetimi
- Kabin üniforması: tüm rütbeler, sadece kabinde

GENEL TANITIM
"Branşımızda iki birim vardır: Gardiyan & Muhafız (GM) ve Denetim Birimi (DB).
Birim bilgileriniz ve üniforma bilgileri DC’de yer alır. Birimde değilseniz birim kıyafetlerini giyemezsiniz."

KURALLAR (Özet)
1- SM’nin altın kuralı adalettir.
2- SM Lideri rütbesi SM-K-KO; Lider: M0sby_1 (Şef)
3- Disiplinsizlik, ciddiyetsizlik, dil bilgisine uymamak yasaktır.
4- Araç sürmek için III Müfettiş+ ve izin gerekir.
5- Emre itaatsizlik ve yetki kötüye kullanımı yasaktır.
6- Öğrenci rütbesi kabin kullanamaz.

SON AŞAMA
- Soru-cevap, anlamadığı noktaları açıkla.
- Wedge ile SS al, tekrar STS.
- DC arkadaşlık ekle/eklet.
- TA DC’de olup olmadığını kontrol et; yoksa davet linki ver.
- /verify desteği ver.
- Aşağıdaki metni gönder:

"Sınır Müfettişleri alımını başarıyla geçtin! Lütfen aşağıdaki linklerden Roblox grubuna katılma isteği gönderin ve Discord sunucusuna katılın.
Rütben geldikten sonra, SM DC’de /update atmayı ve bilgilendirme kanallarını okumayı unutma.

Roblox: https://www.roblox.com/groups/6013768/TA-S-n-r-M-fetti-leri#!/about
Discord: https://discord.gg/wCanBmD9XR

Katılma isteğiniz genellikle 1 saat içinde onaylanır. Gece geç saatlerde gecikmeler normaldir."
`;
}
