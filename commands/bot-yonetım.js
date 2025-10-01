const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Events 
} = require("discord.js");

// 🚨 KRİTİK: Bot sahibinin ID'si (BigInt hatasını önlemek için string olarak tanımlandı)
const OWNER_ID = "1389930042200559706"; 

module.exports = {
  // Komutun Discord'a yüklenmesi için gerekli veriler
  data: new SlashCommandBuilder()
    .setName("yonetim-paneli")
    .setDescription("Bot sahibine özel yönetim panelini açar."),

  permissionLevel: "OWNER", 
  
  /**
   * Komutun çalıştırma fonksiyonu.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    
    // --- 1. KRİTİK YETKİ KONTROLÜ (Sabit ID kullanılır) ---
    if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({
            content: "Bu yönetim paneli komutunu kullanmaya yetkiniz bulunmamaktadır. Yalnızca **Bot Sahibi** kullanabilir.",
            ephemeral: true
        });
    }

    // --- 2. BUTON BİLEŞENLERİNİ OLUŞTURMA ---
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

    // --- 3. YÖNETİM PANELİ MESAJINI GÖNDERME ---
    await interaction.reply({
      content: `🛠️ **BOT YÖNETİM PANELİ**\n\nYetkiniz doğrulandı. Lütfen yapmak istediğiniz işlemi seçin. Butonlar yalnızca sizin için **60 saniye** boyunca aktif olacaktır.`,
      components: [row1, row2],
      ephemeral: true, 
      fetchReply: true 
    });

    // --- 4. BUTON ETKİLEŞİMLERİNİ DİNLEME (COLLECTOR) ---
    // Filtre: Sadece 'panel_' ID'li butonlar ve sadece Bot Sahibi kullanıcısı (OWNER_ID) için
    const filter = (i) => i.customId.startsWith('panel_') && i.user.id === OWNER_ID;
    
    // 60 saniyelik (60000 ms) dinleyici oluştur
    const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 60000 
    }); 

    collector.on('collect', async i => {
        await i.deferUpdate(); // Butona basıldığını Discord'a bildir

        switch (i.customId) {
            case "panel_yeniden_baslat":
                await i.followUp({ content: "⚠️ **UYARI:** Bot yeniden başlatılıyor. (Yeniden başlatma işlemi için PM2 veya benzeri bir araç kullanılıyor olmalı.)", ephemeral: true });
                collector.stop('restart_requested'); 
                
                // Botu durdurma komutu (PM2/Docker otomatik yeniden başlatmayı tetikler)
                setTimeout(() => process.exit(0), 1000); 
                break;
            
            case "panel_durum_degistir":
                client.user.setActivity("Yönetim İşlemi", { type: 3 /* Watching */ }); 
                await i.followUp({ 
                    content: `Botun durumu başarıyla **"İzliyor: Yönetim İşlemi"** olarak ayarlandı.`, 
                    ephemeral: true 
                });
                break;

            case "panel_sunucu_sayi":
                const guildCount = client.guilds.cache.size;
                await i.followUp({ 
                    content: `📊 **İstatistik:** Botun hizmet verdiği anlık sunucu sayısı: **${guildCount}**`, 
                    ephemeral: true 
                });
                break;
            
            case "panel_kapat":
                await i.editReply({ 
                    content: "✅ **Panel kapatıldı.** Tekrar açmak için `/yonetim-paneli` komutunu kullanın.",
                    components: [] // Butonları mesajdan kaldır
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
                // Hata mesajını sessize al
            }
        }
    });
  },
};
