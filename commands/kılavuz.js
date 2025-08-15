const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kilavuz')
        .setDescription('Branş/Birim kılavuzunu DM üzerinden gönderir.'),

    async execute(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('kilavuz_select')
            .setPlaceholder('Branş veya birim seçiniz...')
            .addOptions([
                {
                    label: 'Sınır Müfettişleri',
                    description: 'Sınır Müfettişleri alım kılavuzu',
                    value: 'sm_kilavuz'
                },
                {
                    label: 'Hava Kuvvetleri',
                    description: 'Hava Kuvvetleri Alım kılavuzu',
                    value: 'hava_kuvvetleri_kilavuzu'
                },
                {
                    label: 'Kara Kuvvetleri',
                    description: 'Kara Kuvvetleri Alım kılavuzu',
                    value: 'kara_kuvvetleri_kilavuzu'
                },
                {
                    label: 'Askeri İnzibat',
                    description: 'Askeri İnzibat Alım kılavuzu',
                    value: 'askeri_inzibat_kilavuzu'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: '📜 Lütfen kılavuzunu görmek istediğiniz branşı seçin:',
            components: [row],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000,
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async i => {
            if (i.customId === 'kilavuz_select') {
                let title = '';
                let text = '';

                switch (i.values[0]) {
                    case 'sm_kilavuz':
                        title = 'Sınır Müfettişleri Alım Kılavuzu';
                        text = `
Alım için herhangi bir izin almanıza gerek yoktur. Sunucuda boş bir pad’in önüne geçin ve alıma başlayın.
Bulunduğunuz paddeki duyuru atma tuşuna basınız ve oradan “Sınır Müfettişleri” branşını seçiniz ve duyuru atınız.

Not: Sakın “:n” ile duyuru atmayın. Atan personeller tenzil (demote) yiyecektir.

---

**Temel Şartlar**
Hesap yaşı 50+ gün olmalıdır. (50 gün altı kesinlikle kabul edilemez.)
TSK Rütbesi OR-2+ olmalıdır.
Herhangi başka bir askeri grupta bulunmamalıdır. (İttifak olduğumuz gruplar hariç.)
Hesabı -13 olmamalıdır.
Discord hesabı olmalıdır.
Başka bir branşta olmamalıdır. (Kişinin profiline girerek gruplarından kontrol ediniz.)
Sınır Müfettişleri kara listesinde olmamalıdır. (DC üzerinden “#karaliste” kontrolü yapınız.)
TA Discord sunucusunda /verify yapmış olmalı. (TA DC üzerinden katılımcıyı etiketlemeyi deneyerek kontrol edebilirsiniz.)

---

**1 - Kendinizi Tanıtın ve Kuralları Anlatılır**
Merhaba, ben Başmüfettiş (İsim). Sınır Müfettişleri alımını ben gerçekleştireceğim. Alım boyunca bana "Başmüfettişim" diye hitap edeceksiniz. K.İ almadan konuşmak yasaktır. Dilerseniz başlayalım.

**2 - Temel Şartlar Kontrol Edilir**
:profile (isim) yazılarak personelin profili kontrol edilir.
Safe Chat Enabled kısmı “Kapalı” olmalı.
Grup durumu “Temiz” olmalı.
Hesap yaşı 50+ gün olmalı.

---

**3 - Jackler Çektirilir**
5 JJ 5 GJ 1 HJ Başla!
Jackleri çeken personeller atlama yaparsa uyarılır ve devam ettiği takdirde alımdan atılacaktır. Mobiller ve yavaş çekenlere jack atlatabilirsiniz veya yarısını çekebilirler.
HJ nedir bilmeyen personellere öğretiniz.

---

**4 - Dönmeler Yaptırılır**
Dönmeleri yaptırın.
Personelleri aşırı şekilde zorlamanıza gerek yoktur ama personel sağını ve solunu bile bilmiyorsa SM olamaz.
En fazla 10 tane komut yaptırın. Toplamda 3 kere yanlış yaparsa atılır.
Her hatasında personellere doğrusunu gösterin.

---

**5 - Formasyonlar Yaptırılır**
SFL, Wedge, Sağ kanat, Sol kanat ve STS formasyonları yaptırın.
Personelin sırayla yapması ve doğru yapması önemlidir.
Bilmeyen olursa kısaca öğretin.
Öğretmenize rağmen hata yapan varsa alımdan atabilirsiniz.

---

**6 - Dil Bilgisi Testi Yaptırılır**
Aşağıda bulunan hatalı cümlelerden 3 tanesini katılımcılara atarak düzeltmelerini isteyiniz.
Örnekler:
* komutanım rütbem verildimi (Doğrusu: Komutanım, rütbem verildi mi?)
* komutanım gelirmisiniz (Doğrusu: Komutanım, gelir misiniz?)
* hiçbirşey beni durduramaz (Doğrusu: Hiçbir şey beni durduramaz!)
* paşam denetim varmı (Doğrusu: Paşam, denetim var mı?)
* paşam nasılsınız (Doğrusu: Paşam, nasılsınız?)
“/w” üzerinden cevaplamalarını isteyin.
2 soruyu yanlış yapan atılır ve katılımcı yanlış yaptığı sorular için doğrusu gösterilir.

---

**7 - Tanıtım Yapılır**
:team (katılımcının tam ismi) Sınır 
Bu komut ile personeli SM takımına atabilirsiniz.
Personellerin reset çekmesini isteyin ve sizde reset çekin.

**Kıyafet Tanıtımı**
* **Zorunlu Yüz:** “Not Sure If...”
* **SM LR Üniforması:** Öğrenci, Müfettişler ve Stajyer rütbeleri giyer.
* **SM MR Üniforması:** Baş Müfettiş Adayı / Kıdemli Baş Müfettiş arası giyer.
* **SM Tören Üniforması:** Sadece Genel Branş Denetimi olduğu zamanlarda giyilir.
* **Kabin Üniforması:** Bütün rütbeler giyer; sadece kabin kullanılırken.

**Genel Tanıtım**
Branşımızda iki tane birim vardır, bunlar Gardiyan & Muhafız (GM) ve Denetim Birimi (DB). Birimlerin ve üniformaların hakkında bilgiyi DC üzerinden edinebilirsiniz. Birimde değilseniz, birim kıyafetlerini giyemezsiniz.

**Temel Kurallar**
1. Sınır Müfettişlerinin altın kuralı adalettir.
2. SM liderinin rütbesi SM-K-KO’dur. SM Lideri M0sby_1 Şef’tir.
3. SM içerisinde disiplinsizlik, ciddiyetsizlik ve dil bilgisine uymamak yasaktır.
4. Araç sürmek için III Müfettiş+ rütbesine ihtiyacınız vardır ve izin almadan araç süremezsiniz.
5. Emre itaat etmemek ve sahip olduğunuz yetkileri kötüye kullanmak yasaktır.
6. Öğrenci rütbesinde bulunan personeller kabini kullanamaz.

---

**Son Aşama**
Personellere anlamadıkları bir şey olup olmadığını sorun. Tüm anlamadıkları noktaları açıklayın. Ardından, Wedge komutu ile SS alınız. Tekrardan STS yaptırın ve personellerden size Discord üzerinden arkadaşlık isteği atmalarını söyleyin.
Personellerin TA Discord sunucusunda olup olmadıklarını kontrol edin. Eğer yoksalar, kendilerine TA Resmi DC bağlantısını gönderin. (discord.gg/taf)
Discord üzerinde “/verify” olmaları konusunda yardımcı olun.

**Başarılı Aday Metni**
Sınır Müfettişleri alımını başarıyla geçtin! Lütfen aşağıdaki linklerden Roblox grubuna katılma isteği gönderin ve Discord sunucusuna katılın.
Rütben geldikten sonra, SM discord içerisinde /update atmayı ve bütün bilgilendirme kanallarını okumayı unutma. Çoğu sorunun cevabı o kanallarda hazır olarak yazıyor.

Roblox: https://www.roblox.com/groups/33389098
Discord: https://discord.gg/wCanBmD9XR

Katılma isteğiniz genellikle 1 saat içerisinde onaylanır. Eğer 1 saate aşkın süredir gruba alınmadıysanız bana yazabilirsiniz ama geciktiği durumlarda sabırlı olmayı da unutmayın. Gece geç saatlerde onaylanmaması normaldir.
`;
                        break;
                    case 'hava_kuvvetleri_kilavuzu':
                        title = 'Hava Kuvvetleri Alım Kılavuzu';
                        text = `
Hava Kuvvetleri'ne hoş geldin! Bu alım, gökyüzünün kartalı olmak isteyenler için. Unutma, uçmak için sadece kanat değil, disiplin ve bilgi de gerekir.

**Temel Şartlar**
* **Hesap Yaşı:** En az 90 gün tecrübeli olmalısın.
* **TSK Rütbesi:** Üstçavuş (E-5) ve üzeri. Rütben yetersizse, önce tecrübe edin.
* **İletişim:** Uçuş esnasında net iletişim şart olduğu için mikrofonun çalışır durumda olmalı.
* **Hazırlık:** Uçuş teorisi sınavından geçmen için önceden bilgi edinmelisin.

**Alım Aşamaları**
1.  **Tanıtım:** Kendini tanıt ve "Komutanım" diye hitap etmesini iste.
2.  **Şart Kontrolü:** Hesap yaşı, rütbe ve grup durumunu kontrol et.
3.  **Teori Sınavı:** Uçuş teorisi ve kuralları hakkında sorular sor. Yanlış yapan elenir.
4.  **Uçuş Pratiği:** Eğitim uçağı ile temel manevraları yaptır.
5.  **Tanıtım:** Hava Kuvvetleri kıyafetlerini ve rütbe hiyerarşisini tanıt.
6.  **Son Kontrol:** Sorularını yanıtla ve Discord üzerinden iletişim kurmasını iste.
`;
                        break;
                    case 'kara_kuvvetleri_kilavuzu':
                        title = 'Kara Kuvvetleri Alım Kılavuzu';
                        text = `
Vatan sana emanet! Bu alım, Kara Kuvvetleri'nin en seçkin askerlerini belirlemek için. Hazırsan, komutanlarını dinle ve harekete geç.

**Temel Şartlar**
* **Hesap Yaşı:** En az 45 gün. Ciddiyetini bu şekilde kanıtla.
* **TSK Rütbesi:** Onbaşı (OR-3) ve üzeri.
* **Disiplin:** Emirlere sorgusuz sualsiz itaat etmen beklenir.
* **Fiziksel Yetenek:** Jack ve koşu testlerinden geçmelisin.

**Alım Aşamaları**
1.  **Tanıtım:** Kendini tanıt ve hitap şeklini belirle.
2.  **Şart Kontrolü:** Gerekli şartları karşıladığından emin ol.
3.  **Fiziksel Test:** Jack, mekik ve şınav gibi temel askeri hareketleri yaptır.
4.  **Silah Kullanımı:** Temel silah kullanma ve nişan alma becerilerini test et.
5.  **Formasyon:** SFL, Wedge gibi temel askeri formasyonları yaptır.
6.  **Kurallar:** Kara Kuvvetleri'nin temel kurallarını ve disiplinini anlat.
`;
                        break;
                    case 'askeri_inzibat_kilavuzu':
                        title = 'Askeri İnzibat Alım Kılavuzu';
                        text = `
Disiplin ve düzenin koruyucusu olmaya hazır mısın? Askeri İnzibat, ordunun kanun uygulayıcılarıdır. Bu alım, titiz ve dikkatli adaylar içindir.

**Temel Şartlar**
* **Hesap Yaşı:** En az 60 gün.
* **TSK Rütbesi:** Astsubay (E-4) ve üzeri.
* **Gözlem Yeteneği:** Çevik ve dikkatli olmalısın.
* **Kurallar:** TSK'nın tüm kurallarını bilmelisin.

**Alım Aşamaları**
1.  **Tanıtım:** Kendini tanıt ve "Komutanım" hitabını kullanmasını iste.
2.  **Şart Kontrolü:** Belirlenen şartları karşıladığını doğrula.
3.  **Gözlem Testi:** Ortamdaki düzensizlikleri veya kural ihlallerini bulmasını iste.
4.  **Teori Sınavı:** TSK içindeki temel yönetmelik ve kurallar hakkında sorular sor.
5.  **Role Play (RP):** Bir kural ihlali senaryosu üzerinden nasıl tepki vereceğini test et.
6.  **Kurallar:** Askeri İnzibat'ın yetkilerini ve sorumluluklarını anlat.
`;
                        break;
                    default:
                        title = 'Hata';
                        text = 'Geçersiz bir seçim yaptın.';
                        break;
                }

                const chunks = text.match(/[\s\S]{1,4000}/g) || [];

                try {
                    for (let idx = 0; idx < chunks.length; idx++) {
                        const embed = new EmbedBuilder()
                            .setTitle(`${title}${chunks.length > 1 ? ` (Bölüm ${idx + 1})` : ''}`)
                            .setDescription(chunks[idx])
                            .setColor(0x00AE86);

                        await interaction.user.send({ embeds: [embed] });
                    }

                    await i.reply({
                        content: `📩 **${title}** kılavuzu DM'ne gönderildi.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error(error);
                    await i.reply({
                        content: '❌ Sana DM gönderemedim. DM’lerin açık olduğundan emin ol.',
                        ephemeral: true
                    });
                }
                
                collector.stop();
            }
        });
    }
};
