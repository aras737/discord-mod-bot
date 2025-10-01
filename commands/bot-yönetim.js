const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Events 
} = require("discord.js");

module.exports = {
  // Bu komutun deploy edilmesi için gerekli veriler
  data: new SlashCommandBuilder()
    .setName("yonetim-paneli")
    .setDescription("Bot sahibine özel yönetim panelini açar."),

  // Bot sahibine özel yetkilendirme seviyesi tanımı (Ana dosyanızdaki mantığa uygun olmalı)
  permissionLevel: "OWNER", 
  
  /**
   * Komutun ana çalıştırma fonksiyonu.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    
    // --- BOT SAHİBİ ID'SİNİ OTOMATİK BULMA ---
    let ownerId;
    
    // client.application hazırsa owner bilgisine eriş
    if (client.application && client.application.owner) {
        // Eğer bot bir takıma aitse (Team), ownerId'yi kullan. Aksi halde kullanıcının kendi ID'si.
        ownerId = client.application.owner.ownerId || client.application.owner.id;
    } else {
        // Hazır olmadan çağrılırsa veya bir hata olursa uyarı ver
        return interaction.reply({
            content: "Bot sahibi bilgisi yüklenirken bir sorun oluştu. Lütfen botun tam olarak başlatılmasını bekleyin.",
            ephemeral: true
        });
    }

    // --- KRİTİK YETKİ KONTROLÜ ---
    if (interaction.user.id !== ownerId) {
        return interaction.reply({
            content: "Bu yönetim paneli komutunu kullanmaya yetkiniz bulunmamaktadır. Yalnızca Bot Sahibi bu komutu çalıştırabilir.",
            ephemeral: true
        });
    }

    // --- BUTON BİLEŞENLERİNİ OLUŞTURMA ---
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

    // --- YÖNETİM PANELİ MESAJINI GÖNDERME ---
    await interaction.reply({
      content: `🛠️ **BOT YÖNETİM PANELİ**\n\nBot Sahibi ID'si otomatik olarak tespit edildi: **${ownerId}**.\nLütfen yapmak istediğiniz işlemi seçin. Butonlar yalnızca sizin için **60 saniye** boyunca aktif olacaktır.`,
      components: [row1, row2],
      ephemeral: true, 
      fetchReply: true 
    });

    // --- BUTON ETKİLEŞİMLERİNİ DİNLEME (COMPONENT COLLECTOR) ---
    // Filtre: Sadece 'panel_' ID'sine sahip butonlar ve sadece Bot Sahibinin etkileşimleri
    const filter = (i) => i.customId.startsWith('panel_') && i.user.id === ownerId;
    
    // 60 saniyelik bir dinleyici oluştur
    const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 60000 
    }); 

    collector.on('collect', async i => {
        // Butona basıldığını Discord'a bildir
        await i.deferUpdate(); 

        switch (i.customId) {
            case "panel_yeniden_baslat":
                await i.followUp({ content: "⚠️ **UYARI:** Bot yeniden başlatılıyor. Bu işlem birkaç saniye sürecek. Botunuzun PM2 gibi bir araçla çalıştırıldığından emin olun.", ephemeral: true });
                collector.stop('restart_requested'); 
                
                // Botu yeniden başlatma komutu
                setTimeout(() => process.exit(0), 1000); 
                break;
            
            case "panel_durum_degistir":
                // Burada bir Modal (form) gönderebilir veya direkt setActivity kullanabilirsiniz.
                await i.followUp({ 
                    content: `Yeni durum (örneğin "Oynuyor: Yeni sürüm") ayarlamak için Modal sistemi buraya entegre edilmelidir. Şu an sadece bilgilendirme yapılıyor.`, 
                    ephemeral: true 
                });
                break;

            case "panel_sunucu_sayi":
                const guildCount = client.guilds.cache.size;
                await i.followUp({ 
                    content: `Botun anlık olarak hizmet verdiği sunucu sayısı: **${guildCount}**`, 
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
                // Mesaj zaten silinmiş veya güncellenmiş olabilir.
            }
        }
    });
  },
};
