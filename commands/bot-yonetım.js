const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Events 
} = require("discord.js");

module.exports = {
  // Komutun Discord'a yüklenmesi için gerekli veriler
  data: new SlashCommandBuilder()
    .setName("yonetim-paneli")
    .setDescription("Bot sahibine özel yönetim panelini açar."),

  // Bu komut, ana dosyanızdaki yetkilendirme sistemi için "OWNER" seviyesini gerektirir.
  permissionLevel: "OWNER", 
  
  /**
   * Komutun çalıştırma fonksiyonu.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    
    // --- 1. BOT SAHİBİ ID'SİNİ OTOMATİK BULMA ---
    let ownerId;
    
    // client.application hazır ve owner bilgisine erişilebilir durumda mı kontrol et
    if (client.application && client.application.owner) {
        // Eğer bot bir takıma aitse (Team), ownerId'yi, aksi halde kullanıcının ID'sini kullan.
        ownerId = client.application.owner.ownerId || client.application.owner.id;
    } else {
        return interaction.reply({
            content: "Bot sahibinin ID bilgisi henüz yüklenemedi. Botun tam olarak hazır olduğundan emin olun.",
            ephemeral: true
        });
    }

    // --- 2. KRİTİK YETKİ KONTROLÜ ---
    if (interaction.user.id !== ownerId) {
        return interaction.reply({
            content: "Bu yönetim paneli komutunu kullanmaya yetkiniz bulunmamaktadır. Yalnızca **Bot Sahibi** kullanabilir.",
            ephemeral: true
        });
    }

    // --- 3. BUTON BİLEŞENLERİNİ OLUŞTURMA ---
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("panel_yeniden_baslat")
          .setLabel("Botu Yeniden Başlat")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("panel_durum_degistir")
          .setLabel("Durum Değiştir")
          .setStyle(ButtonStyle.Primary),
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("panel_sunucu_sayi")
          .setLabel("Sunucu Sayısını Kontrol Et")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("panel_kapat")
          .setLabel("Paneli Kapat")
          .setStyle(ButtonStyle.Success),
      );

    // --- 4. YÖNETİM PANELİ MESAJINI GÖNDERME ---
    await interaction.reply({
      content: `🛠️ **BOT YÖNETİM PANELİ**\n\nBot Sahibi ID'si: **${ownerId}**\nLütfen yapmak istediğiniz işlemi seçin. Butonlar yalnızca sizin için **60 saniye** boyunca aktif olacaktır.`,
      components: [row1, row2],
      ephemeral: true, 
      fetchReply: true 
    });

    // --- 5. BUTON ETKİLEŞİMLERİNİ DİNLEME (COLLECTOR) ---
    // Filtre: Sadece 'panel_' ID'li butonlar ve sadece Bot Sahibi kullanıcısı için
    const filter = (i) => i.customId.startsWith('panel_') && i.user.id === ownerId;
    
    // 60 saniyelik (60000 ms) dinleyici oluştur
    const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 60000 
    }); 

    collector.on('collect', async i => {
        await i.deferUpdate(); // Butona basıldığını Discord'a bildir

        switch (i.customId) {
            case "panel_yeniden_baslat":
                await i.followUp({ content: "⚠️ **UYARI:** Bot yeniden başlatılıyor. Bu işlem birkaç saniye sürecek. (PM2 veya benzeri bir araçla çalıştırılıyorsanız otomatik olarak ayağa kalkacaktır.)", ephemeral: true });
                collector.stop('restart_requested'); 
                
                // Botu durdurma komutu (PM2, Docker gibi araçlarla otomatik yeniden başlatmayı tetikler)
                setTimeout(() => process.exit(0), 1000); 
                break;
            
            case "panel_durum_degistir":
                // Örnek bir işlem: Botun durumunu (activity) değiştirme
                client.user.setActivity("Yönetim Altında", { type: 3 /* Watching */ }); 
                await i.followUp({ 
                    content: `Botun durumu başarıyla **"İzliyor: Yönetim Altında"** olarak değiştirildi.`, 
                    ephemeral: true 
                });
                break;

            case "panel_sunucu_sayi":
                const guildCount = client.guilds.cache.size;
                const userCount = client.users.cache.size;
                await i.followUp({ 
                    content: `📊 **İstatistikler:**\n- Sunucu Sayısı: **${guildCount}**\n- Önbellekteki Kullanıcı Sayısı: **${userCount}**`, 
                    ephemeral: true 
                });
                break;
            
            case "panel_kapat":
                await i.editReply({ 
                    content: "✅ **Panel kapatıldı.** Tekrar açmak için `/yonetim-paneli` komutunu kullanın.",
                    components: [] // Butonları mesajdan kaldır ve dinlemeyi bitir
                });
                collector.stop('closed_by_user'); 
                break;
        }
    });

    collector.on('end', async (collected, reason) => {
        // Zaman dolduğunda mesajı güncelle ve butonları kaldır
        if (reason === 'time') {
            try {
                await interaction.editReply({ 
                    content: "⏳ **Panel oturumu zaman aşımına uğradı.** Butonlar devre dışı bırakıldı.",
                    components: []
                });
            } catch (error) {
                // Mesaj zaten silinmiş veya güncellenmiş olabilir, hatayı sessize al
            }
        }
    });
  },
};
