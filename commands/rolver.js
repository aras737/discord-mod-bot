const { 
  SlashCommandBuilder, 
  PermissionFlagsBits 
} = require("discord.js");

module.exports = {
  // Komutun Discord'a yüklenmesi için gerekli veriler
  data: new SlashCommandBuilder()
    .setName("rollerisil")
    .setDescription("UYARI: Sunucudaki TÜM rolleri (Botun erişebildiği) siler.")
    // Bu komutun çalışması için KESİNLİKLE YÖNETİCİ yetkisi gereklidir.
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 
  
  // Ana dosyanızdaki yetkilendirme sistemi için ADMIN veya OWNER seviyesini ayarlayın.
  permissionLevel: "ADMINISTRATOR", 

  /**
   * Komutun çalıştırma fonksiyonu.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    
    // Güvenlik Kontrolü: Botun bu işlemi yapmaya yetkisi var mı?
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
            content: "❌ Botun rolleri yönetme yetkisi yok. Lütfen botun rolünün en yukarıda olduğundan emin olun.",
            ephemeral: true
        });
    }

    // Kullanıcıya onay sorusu
    await interaction.reply({
        content: `⚠️ **SON UYARI!** Sunucudaki **TÜM** rolleri silmek üzeresiniz. Bu işlem geri alınamaz ve sunucuyu ciddi şekilde bozabilir.\n\nEmin misiniz? Onaylamak için **EVET SİL** yazın:`,
        ephemeral: true
    });

    // Mesaj dinleyicisi ile onay bekleme
    const filter = (m) => m.author.id === interaction.user.id && m.content === 'EVET SİL';
    
    try {
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
        const confirmation = collected.first();

        if (confirmation.content === 'EVET SİL') {
            await interaction.followUp({
                content: "✅ Onaylandı. Rol silme işlemi başlatılıyor...",
                ephemeral: true
            });

            // Silinen rollerin sayacını tut
            let deletedCount = 0;
            const rolesToDelete = interaction.guild.roles.cache;

            // Rolleri tek tek sil
            for (const [id, role] of rolesToDelete) {
                // @everyone rolünü SİLEMEYİZ ve Botun kendi rolünü SİLMEMELİYİZ
                if (role.name === '@everyone' || role.managed || role.id === interaction.guild.roles.everyone.id || role.id === interaction.guild.members.me.roles.highest.id) {
                    continue; // Bu rolleri atla
                }
                
                try {
                    await role.delete("Sunucu sahibinin isteği üzerine tüm roller siliniyor.");
                    deletedCount++;
                } catch (error) {
                    console.error(`Rol silinirken hata oluştu (${role.name}):`, error.message);
                }
            }

            await interaction.followUp({
                content: `🔥 **İŞLEM TAMAMLANDI!** Sunucudaki erişilebilen toplam **${deletedCount}** rol silinmiştir.`,
                ephemeral: true
            });
            
        }

    } catch (e) {
        // Zaman aşımı veya farklı bir mesaj gönderme
        await interaction.followUp({ 
            content: "❌ Rol silme işlemi zaman aşımına uğradı veya iptal edildi.", 
            ephemeral: true 
        });
    }
  },
};
