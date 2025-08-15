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
**Giriş**
Sınır Müfettişleri birimine hoş geldin! Bu kılavuz, alım sürecini sorunsuz tamamlaman için sana yol gösterecek. Hazırsan, birimdeki geleceğin için ilk adımı atalım.

**Duyuru ve Başlangıç**
Alım için kimseye sormana gerek yok. Boş bir alım pad'ine geç ve duyuru tuşunu kullanarak “Sınır Müfettişleri” duyurusunu at.
**UYARI:** Duyuruları “:n” komutuyla atmak kesinlikle yasaktır! Bu kuralı ihlal eden personeller derhal tenzil edilecektir.

---

**Temel Şartlar**
* **Hesap Yaşı:** En az 50 gün. Bu, birimimizin aradığı olgunluğun temel göstergesidir.
* **TSK Rütbesi:** En az OR-2+ (Er).
* **Grup Durumu:** Başka askeri gruplarda bulunmaman gerekir. İttifak gruplarımız bu kuralın dışındadır.
* **Hesap Güvenliği:** Hesap yaşın -13 olmamalı.
* **İletişim:** Discord hesabına sahip olman zorunludur.
* **Branş Kontrolü:** Başka bir TSK branşında olmamalısın.
* **Kara Liste Kontrolü:** "SM Kara Liste"de isminin olmadığından emin ol. Discord'daki #karaliste kanalını kontrol et.
* **Doğrulama:** TA Discord sunucusunda /verify komutunu kullanmış olmalısın.

---

**Alım Aşamaları**

**1. Kendini Tanıt ve Kuralları Öğren**
“Merhaba, ben Başmüfettiş (İsmin). Sınır Müfettişleri alımını ben yöneteceğim. Alım boyunca bana **'Başmüfettişim'** diye hitap etmelisin. **'K.İ'** (Konuşma İzni) almadan konuşmak yasak. Hazırsan, başlayalım.”

**2. Temel Şartlar Kontrolü**
:profile (isim) komutu ile adayın profilini kontrol et.
Safe Chat Enabled: “Kapalı” olmalı.
Grup Durumu: “Temiz” olmalı.
Hesap Yaşı: En az 50 gün olmalı.
Adayın ismini Discord'daki #karaliste kanalından kontrol etmeyi unutma.

**Önemli:** Aday Roblox gruplarında BL (yasaklı) bir grupta ise, çıkması için uyar. Çıkmazsa veya şartları karşılamazsa, eksik şartı belirterek alımdan at.

**3. Fiziksel Testler**
**a) Jack Hareketleri:**
\`5 JJ, 5 GJ, 1 HJ Başla!\`
Hatalı yapan veya atlayan adayları uyar. Tekrar eden hatalarda alımdan at. Yeni başlayanlara hareketleri öğretmekten çekinme.

**b) Dönüş Komutları:**
En fazla 10 adet dönüş komutu vererek adayın yön bilgisini test et. \`Sağa dön\`, \`Sola dön\`, \`Arkaya dön\` gibi komutlar kullan. Toplamda 3 yanlış yapan elenir. Her hatada doğrusunu göster.

**4. Formasyon Becerisi**
SFL, Wedge, Sağ kanat, Sol kanat ve STS gibi temel formasyonları yaptır. Adayın sırayla ve doğru şekilde yapması önemlidir. Bilmeyenlere kısaca göster, ancak hatalar devam ederse alımdan atabilirsin.

**5. Dil Bilgisi Testi**
Aşağıdaki hatalı cümlelerden en az 3 tanesini seçerek adaya gönder ve düzeltmesini iste.
- \`komutanım rütbem verildimi\` (Doğrusu: Komutanım, rütbem verildi mi?)
- \`komutanım gelirmisiniz\` (Doğrusu: Komutanım, gelir misiniz?)
- \`hiçbirşey beni durduramaz\` (Doğrusu: Hiçbir şey beni durduramaz!)
Adaydan cevaplarını \`/w\` (fısıltı) üzerinden göndermesini iste. 2 yanlış yapan elenir. Adayın dil bilgisi seviyesinden emin ol.

**6. Tanıtım ve Hazırlık**
\`!team (katılımcının tam ismi) Sınır\` komutu ile adayı takıma al.
Hem adayın hem de senin reset çekmesini iste.

**Kıyafet Tanıtımı**
* **Zorunlu Yüz:** “Not Sure If...” yüzünü takmalısın.
* **SM LR Üniforması:** Öğrenci, Müfettişler ve Stajyerler giyer.
* **SM MR Üniforması:** Baş Müfettiş Adayı / Kıdemli Baş Müfettiş rütbeleri giyer.
* **SM Tören Üniforması:** Yalnızca Genel Branş Denetimleri sırasında giyilir.

**Genel Bilgiler**
* Birimimizde **Gardiyan & Muhafız (GM)** ve **Denetim Birimi (DB)** olmak üzere iki birim bulunur.
* Birim kıyafetleri, yalnızca birime kabul edildiğinde giyilebilir.

**Temel Kurallar**
1. Sınır Müfettişlerinin ana kuralı **adalettir**.
2. SM Lideri **M0sby_1 Şef**'tir.
3. Disiplinsizlik ve ciddiyetsizlik kesinlikle yasaktır.
4. Araç kullanmak için en az **III Müfettiş+** rütbesinde olmalısın ve izin almalısın.
5. Yetkini kötüye kullanmak veya emre itaatsizlik yasaktır.
6. Öğrenci rütbesi kabin kullanamaz.

**7. Son Aşama**
Adayın soruları varsa yanıtla. Wedge komutu ile SS al. Tekrar STS yaptır ve adaydan sana Discord'dan arkadaşlık isteği göndermesini iste.
TA Discord'da değilse, bağlantıyı (\`discord.gg/taf\`) gönder ve \`/verify\` konusunda yardımcı ol.

**Başarılı Aday Metni**
**Sınır Müfettişleri alımını başarıyla geçtin!** Lütfen aşağıdaki linklerden Roblox grubuna katılma isteği gönder ve Discord sunucusuna katıl.
Rütben geldikten sonra, SM discord içinde \`/update\` atmayı ve tüm bilgilendirme kanallarını okumayı unutma.
**Roblox:** https://www.roblox.com/groups/33389098
**Discord:** https://discord.gg/wCanBmD9XR
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
