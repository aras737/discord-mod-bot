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
                    label: 'Diğer Branş',
                    description: 'Başka bir branşın kılavuzu',
                    value: 'diger_kilavuz'
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

                if (i.values[0] === 'sm_kilavuz') {
                    title = 'Sınır Müfettişleri Alım Kılavuzu';
                    text = `Sınır Müfettişleri Alım Kılavuzu


Alım için herhangi bir izin almanıza gerek yoktur. Sunucuda boş bir pad’in önüne geçin ve alıma başlayın.
Bulunduğunuz padde ki duyuru atma tuşuna basınız ve oradan “Sınır Müfettişleri” branşını seçiniz ve duyuru atınız.

Not: Sakın “:n” ile duyuru atmayın. Atan personeller tenzil (demote) yiyecektir.



Temel Şartlar
Hesap yaşı 50+ gün olmalıdır. (50 gün altı kesinlikle kabul edilemez.)
TSK Rütbesi OR-2+ olmalıdır. 
Herhangi başka bir askeri grupta bulunmamalıdır. (İttifak olduğumuz gruplar hariç.)
Hesabı -13 olmamalıdır.
Discord hesabı olmalıdır.
Başka bir branşta olmamalıdır. (Kişinin profiline girerek gruplarından kontrol ediniz.)
Sınır Müfettişleri kara listesinde olmamalıdır. (DC üzerinden “#karaliste” kontrolü yapınız.)
TA Discord sunucusunda /verify yapmış olmalı. (TA DC üzerinden katılımcıyı etiketlemeyi deneyerek kontrol edebilirsiniz.)



1 - Kendinizi Tanıtın ve Kuralları Anlatılır
Merhaba, ben Başmüfettiş (İsim). Sınır Müfettişleri alımını ben gerçekleştireceğim. Alım boyunca bana "Başmüfettişim" diye hitap edeceksiniz. K.İ almadan konuşmak yasaktır. Dilerseniz başlayalım.

2 - Temel Şartlar Kontrol Edilir	
:profile (isim) yazılarak personelin profili kontrol edilir.
Safe Chat Enabled kısmı “Kapalı” olmalı.
Grup durumu “Temiz” olmalı.
Hesap yaşı 50+ gün olmalı.

Ardından, kişi Sınır Müfettişleri Discord sunucusunda “#karaliste” kanalında ismi var mı diye kontrol edilir. 

Eğer katılımcı şartları karşılamıyorsa veya kara listede ise katılımcının karşılamadığı şart kendisine söylenip, alımdan atılır. 

!
Son olarak, kişinin Roblox gruplarını PC iseniz şimdi, mobilseniz log girmeden önce kontrol ederek BL grupta olup olmadığını ve branşının olup olmadığını kontrol ediniz. İsterseniz bu kontrolü katılımcılar jack çekerkende yapabilirsiniz.
Eğer katılımcı BL bir grupta ise çıkması istenir, çıkmazsa alımdan atılır.
!

3 - Jackler Çektirilir

5 JJ 5 GJ 1 HJ Başla!

Jackleri çeken personeller atlama yaparsa uyarılır ve devam ettiği takdirde alımdan atılacaktır. Mobiller ve yavaş çekenlere jack atlatabilirsiniz veya yarısını çekebilirler.
HJ nedir bilmeyen personellere öğretiniz.

4 - Dönmeler Yaptırılır

Dönmeleri yaptırın. 
Personelleri aşırı şekilde zorlamanıza gerek yoktur ama personel sağını ve solunu bile bilmiyorsa SM olamaz.
En fazla 10 tane komut yaptırın. Toplamda 3 kere yanlış yaparsa atılır.
Her hatasında personellere doğrusunu gösterin.

5 - Formasyonlar Yaptırılır

SFL, Wedge, Sağ kanat, Sol kanat ve STS formasyonları yaptırın.
Personelin sırayla yapması ve doğru yapması önemlidir.
Bilmeyen olursa kısaca öğretin.
Öğretmenize rağmen hata yapan varsa alımdan atabilirsiniz.

6 - Dil Bilgisi Testi Yaptırılır

Aşağıda bulunan hatalı cümlelerden 3 tanesini katılımcılara atarak düzeltmelerini isteyiniz.

komutanım rütbem verildimi (Doğrusu: Komutanım, rütbem verildi mi?)
komutanım gelirmisiniz (Doğrusu: Komutanım, gelir misiniz?)
hiçbirşey beni durduramaz (Doğrusu: Hiçbir şey beni durduramaz!)Sonda bulunan ünleme çok takılmayın.
paşam denetim varmı (Doğrusu: Paşam, denetim var mı?)
paşam nasılsınız (Doğrusu: Paşam, nasılsınız?)

“/w” üzerinden cevaplamalarını isteyin.
2 soruyu yanlış yapan atılır ve katılımcı yanlış yaptığı sorular için doğrusu gösterilir.
İsterseniz sizde bu temel düzeyden aklınızdan sorular sorabilirsiniz. Yani, yukarıdaki sorulara bağlı kalmak zorunda değilsiniz. Yinede yukarıdaki sorulara bağlı kalmanız önerilir.
Katılımcıların dil bilgisi seviyelerinin iyi olduğuna emin olmanız gerekmektedir. Yani, dil bilgisi testini geçtikten sonra, dil bilgisi hataları yaparsa atılmasına sebebiyet verebilir.

7 - Tanıtım Yapılır

:team (katılımcının tam ismi) Sınır 
Bu komut ile personeli SM takımına atabilirsiniz.
Personellerin reset çekmesini isteyin ve sizde reset çekin.
Ardından, personelleri kıyafet giydirmeden duvara STS geçirin.


Sınır Müfettişleri Tanıtımı

- Kıyafet Tanıtımı

Zorunlu yüz giyilir.
Zorunlu takmanız gereken yüz; “Not Sure If...” bunu takacaksınız.

SM LR üniforması giyilir.
Bu üniformayı SM LR giyer; Öğrenci, Müfettişler ve Stajyer rütbeleri giyer. Görevleri eğitime girmek ve kabin ile ilgilenmektir. Siz bunu giyeceksiniz.

SM MR üniforması giyilir.
Bu üniformayı SM MR giyer; Baş Müfettiş Adayı / Kıdemli Baş Müfettiş arası giyer. Alım, eğitim yaparlar ve personellerin kü çük problemleri ile ilgilenirler. Kendilerine “Başmüfettişim” şeklinde hitap edilir.

SM Tören üniforması giyilir.
Bu üniformayı SM LR-MR giyer; sadece Genel Branş Denetimi olduğu zamanlarda giyilir.

Kabin üniforması giyilir.
Bu üniformayı bütün rütbeler giyer; sadece kabin kullanılırken giyilebilir.

- Genel Tanıtım

Katılımcılara SM LR giymeleri isteyin ve dışarı çıkarıp, STS geçirin.

“Branşımızda iki tane birim vardır, bunlar Gardiyan & Muhafız (GM) ve Denetim Birimi (DB). 
Birimlerin hakkında bilgiyi ve üniformalar hakkında bilgiyi DC üzerinden edinebilirsiniz.
 Birimde değilseniz, birim kıyafetlerini giyemezsiniz.”

Kuralları okuyun.

Şimdi sizlere temel kurallardan bahsedeceğim.

1- Sınır Müfettişlerinin altın kuralı adalettir.
2- SM liderinin rütbesi SM-K-KO’dur. SM Lideri M0sby_1 Şef’tir.
3- SM içerisinde disiplinsizlik, ciddiyetsizlik ve dil bilgisine uymamak yasaktır. 
4- Araç sürmek için III Müfettiş+ rütbesine ihtiyacınız vardır ve izin almadan araç süremezsiniz.
5- Emre itaat etmemek ve sahip olduğunuz yetkileri kötüye kullanmak yasaktır.
6- Öğrenci rütbesinde bulunan personeller kabini kullanamaz.
- Son Aşama

Personellere anlamadıkları bir şey olup olmadığını sorun. Tüm anlamadıkları noktaları açıklayın. Ardından, Wedge komutu ile SS alınız. Tekrardan STS yaptırın ve personellerden size Discord üzerinden arkadaşlık isteği atmalarını söyleyin. Eğer katılımcı arkadaşlık isteği gönderemeyecek durumdaysa siz ona arkadaşlık isteği atın.

Personellerin TA Discord sunucusunda olup olmadıklarını kontrol edin. Eğer yoksalar, kendilerine TA Resmi DC bağlantısını gönderin. (discord.gg/taf)
Discord üzerinde “/verify” olmaları konusunda yardımcı olun.

Son olarak kendilerine aşağıdaki metni kopyalayıp, linkleri atınız.



Sınır Müfettişleri alımını başarıyla geçtin! Lütfen aşağıdaki linklerden Roblox grubuna katılma isteği gönderin ve Discord sunucusuna katılın.

Rütben geldikten sonra, SM discord içerisinde /update atmayı ve bütün bilgilendirme kanallarını okumayı unutma. Çoğu sorunun cevabı o kanallarda hazır olarak yazıyor.

Roblox: https://www.roblox.com/groups/33389098
Discord: https://discord.gg/wCanBmD9XR

Katılma isteğiniz genellikle 1 saat içerisinde onaylanır. Eğer 1 saate aşkın süredir gruba alınmadıysanız bana yazabilirsiniz ama geciktiği durumlarda sabırlı olmayıda unutmayın. Gece geç saatlerde onaylanmaması normaldir. 
`; // Buraya tam metni ekle
                } else if (i.values[0] === 'diger_kilavuz') {
                    title = 'Diğer Branş Kılavuzu';
                    text = `Buraya diğer branşın kılavuzu gelecek...`;
                }

                const chunks = text.match(/[\s\S]{1,4000}/g) || [];

                try {
                    for (let idx = 0; idx < chunks.length; idx++) {
                        const embed = new EmbedBuilder()
                            .setTitle(`${title} ${chunks.length > 1 ? `(Bölüm ${idx + 1})` : ''}`)
                            .setDescription(chunks[idx])
                            .setColor(0x00AE86);

                        await interaction.user.send({ embeds: [embed] });
                    }

                    await i.reply({
                        content: `📩 **${title}** kılavuzu DM'ne gönderildi.`,
                        ephemeral: true
                    });
                } catch {
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
