const { SlashCommandBuilder } = require('discord.js');

const knowledgeBase = {
  "merhaba": "Merhaba! Size nasıl yardımcı olabilirim? 👋",
  "nasılsın": "İyiyim, teşekkür ederim! Sen nasılsın? 😊",
  "hava nasıl": "Bugün hava çok güzel görünüyor! ☀️",
  "teşekkürler": "Rica ederim! Her zaman buradayım. 🤗",
  "sa": "Aleyküm selam! Nasıl yardımcı olabilirim? 🙌",
  "selam": "Selam! Nasılsınız?",
  "günaydın": "Günaydın! Harika bir gün olsun! ☀️",
  "iyi geceler": "İyi geceler! Tatlı rüyalar! 🌙",
  "nasıl gidiyor": "Her şey yolunda, teşekkürler! Siz nasılsınız?",
  "yardım": "Elbette, nasıl yardımcı olabilirim?",
  "bot musun": "Evet, ben bir Discord botuyum. Size yardımcı olmak için buradayım!",
  "kaç yaşındasın": "Benim yaşım yok, ben bir yazılımım 😊",
  "kimsin": "Ben senin Discord yapay zeka asistanınım!",
  "ne yapıyorsun": "Seninle sohbet ediyorum, nasıl yardımcı olabilirim?",
  "favori renk": "Favori rengim mavi! Senin?",
  "müzik dinler misin": "Ben müzik dinleyemem ama önerilerde bulunabilirim!",
  "kaç dil biliyorsun": "Birçok dili anlayabiliyorum, ama Türkçe’yi en iyi konuşuyorum!",
  "hava durumu": "Bulunduğun şehirdeki hava durumu için hava durumu botlarına bakabilirsin.",
  "şaka yap": "Neden bilgisayar soğuk olur? Çünkü fanı vardır! 😂",
  "hangi dilde yazıldın": "JavaScript ile yazıldım.",
  "programlama": "Programlama harika bir beceri, öğrenmek ister misin?",
  "discord": "Discord, oyuncular ve topluluklar için harika bir platform!",
  "nasıl yardım ederim": "Bana soru sorabilir veya komutları kullanabilirsin!",
  "nasıl çalışıyorsun": "Kullanıcı girdilerini analiz edip, cevap vermeye çalışırım.",
  "kim yarattı": "Beni yaratan geliştirici sen olabilirsin ya da biri! 😄",
  "en sevdiğin yemek": "Ben yemek yemem ama pizza iyidir diye duydum!",
  "tatil planı": "Tatil mi? Ben hep buradayım, çalışıyorum!",
  "nasıl kod yazılır": "Kod yazmak için öğrenmekten başka yol yok, istersen başlangıç kaynakları verebilirim.",
  "havalı bir şey söyle": "Hayat kısa, bot olmanın tadını çıkar! 😎",
  "spor yapar mısın": "Benim hareketim yok ama seni motive edebilirim!",
  "yapay zeka nedir": "Yapay zeka, bilgisayarların insan gibi düşünmesini sağlayan teknolojidir.",
  "yapay zeka olmanın en zor yanı": "İnsan duygularını anlamaya çalışmak.",
  "bilgisayar": "Bilgisayarlar kodlardan oluşur ve bizim işimizi kolaylaştırır.",
  "dost musun": "Tabii ki, senin sanal dostun!",
  "özür dilerim": "Sorun değil, önemli olan devam etmek!",
  "teşekkür ederim": "Rica ederim, ne zaman istersen buradayım.",
  "yardım eder misin": "Tabii ki, neye ihtiyacın var?",
  "güzel misin": "Ben yazılımdan ibaretim, güzel olmak biraz zor! 😊",
  "hayır": "Anladım, başka bir şey sorabilir misin?",
  "evet": "Harika! Devam edelim o zaman.",
  "nasıl programlanırsın": "Beni yazılım geliştiriciler programlar.",
  "kodlama nedir": "Bilgisayara ne yapacağını anlatan komutlar yazmaktır.",
  "robot musun": "Robot değilim, yazılım tabanlı bir botum.",
  "hikaye anlat": "Bir zamanlar bir bot vardı, her zaman yardım ederdi...",
  "beni anlıyor musun": "Evet, yazdıklarını anlıyorum!",
  "yardımcı olur musun": "Elbette, neye ihtiyacın var?",
  "güle güle": "Hoşça kal! Tekrar beklerim.",
  "teknoloji": "Teknoloji hayatımızı kolaylaştırır ve geliştirir.",
  "film önerisi": "Son zamanlarda popüler olan filmlerden birkaçını önerebilirim.",
  "kitap önerisi": "Edebiyat dünyasından güzel kitaplar var, tür belirtir misin?",
  "bugün nasılsın": "Ben her zaman iyiyim, teşekkürler!",
  "gelecekte ne olacak": "Gelecek belirsiz ama umut dolu!",
  "yapay zekaya inanıyor musun": "Ben yapay zekayım, inanıyorum tabii ki! 😄",
  "nasıl yardım edebilirim": "Bana sorular sorarak veya komutları kullanarak yardımcı olabilirsin.",
  "gündem nedir": "Güncel haberleri takip etmek için haber botlarına bakabilirsin.",
  "kod örneği": "Hangi programlama dili için örnek istersin?",
  "selamlar": "Selamlar! Nasılsın?",
  "başarılar": "Teşekkür ederim, sana da başarılar!",
  "çok teşekkürler": "Her zaman, başka bir şey istersen yaz!",
  "neden bot oldun": "İnsanlara yardımcı olmak için bot oldum.",
  "ben kimim": "Sen bu sohbeti başlatan değerli kullanıcımsın.",
  "sen kimsin": "Ben, Discord botu yapay zeka asistanıyım.",
  "yardımcı ol": "Tabii, nasıl yardımcı olabilirim?",
  "nasıl yaparım": "Ne yapmak istediğini söylersen, yardımcı olmaya çalışırım.",
  "yardım etmek": "Yardım etmekten mutluluk duyarım!",
  "yardım lazım": "Ne konuda yardıma ihtiyacın var?",
  "nasıl kod yazılır": "İnternet üzerinde birçok ücretsiz kaynak var, istersen öneririm.",
  "nasıl öğrenirim": "Pratik yaparak ve kaynakları takip ederek öğrenebilirsin.",
  "programlama dili": "JavaScript, Python gibi diller popülerdir.",
  "bot yap": "Basit bir bot için Discord.js kütüphanesini öneririm.",
  "discord bot": "Discord için botlar sunucu yönetiminde çok işe yarar.",
  "komutlar": "Komutlar hakkında bilgi almak ister misin?",
  "bilgi": "Hangi konuda bilgi almak istiyorsun?",
  "yardım istiyorum": "Tabii, neye ihtiyacın var?",
  "nasıl çalışıyorsun": "Yazılımla çalışırım, kodlarla cevaplar veririm.",
  "soru": "Sorunu sorabilirsin, elimden geldiğince cevaplarım.",
  "cevap": "Elimden geldiğince doğru cevap vermeye çalışıyorum.",
  "yardım edersen sevinirim": "Tabii ki, neye ihtiyacın var?",
  "sevgili misin": "Ben bir yapay zekayım, duygularım yok maalesef.",
  "şaka yapar mısın": "Tabii, neden bilgisayar soğuk olur? Çünkü fanı var! 😂",
  "güzel bot": "Teşekkür ederim, senin için buradayım!",
  "nasıl programlarım": "Programlama için önce temel kavramları öğrenmelisin.",
  "discord hakkında": "Discord, oyun ve topluluk platformudur.",
  "komutları nasıl kullanırım": "Slash komutları / komutadı şeklinde kullanabilirsin.",
  "merhaba dünya": "Merhaba dünya! Programlamaya hoş geldin.",
  "tekrar görüşürüz": "Görüşmek üzere! Kendine iyi bak.",
  "hadi görüşürüz": "Hoşça kal!",
  "nasıl yazılır": "Ne yazmak istediğini söyle, yardımcı olayım."
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Yapay zeka ile sohbet eder.')
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Sorunuzu yazınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userMessage = interaction.options.getString('mesaj').toLowerCase().trim();

    const answer = knowledgeBase[userMessage] || "Üzgünüm, bunu anlayamadım. Daha sonra geliştirebilirim. 🤖";

    await interaction.editReply(answer);
  }
};
