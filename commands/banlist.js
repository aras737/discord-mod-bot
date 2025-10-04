const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Sunucudaki yasaklı kullanıcıların listesini gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // İşlem uzun sürebileceği için bekleme mesajı gönderilir.
        await interaction.deferReply({ ephemeral: true });

        try {
            const bans = await interaction.guild.bans.fetch();
            const totalBans = bans.size;

            if (totalBans === 0) {
                return interaction.editReply({ 
                    content: 'Bu sunucuda şu anda yasaklı kullanıcı bulunmamaktadır.',
                    ephemeral: true
                });
            }

            // --- GÖRSEL FORMAT MANTIĞI BAŞLANGICI ---
            const maxDescriptionLength = 4096; // Embed açıklama limiti
            let descriptionContent = `Toplam yasaklı kullanıcı: **${totalBans}**\n\n`;
            let banCounter = 1;
            const embeds = [];

            // Tüm yasaklılar üzerinde döngü
            for (const [userId, ban] of bans.entries()) {
                const userTag = ban.user.tag;
                // Sebep çok uzunsa kısaltılır.
                const reason = ban.reason ? ban.reason : 'Sebep belirtilmedi';
                
                // Görseldeki formatta metin satırını oluştur
                const entry = 
                    `**${banCounter}. ${userTag}**\n` + 
                    `ID: ${userId}\n` +
                    `Sebep: ${reason}\n\n`;
                
                // Eğer mevcut içerik + yeni giriş, limiti aşacaksa
                if (descriptionContent.length + entry.length > maxDescriptionLength) {
                    
                    // Önceki sayfayı Embed olarak kaydet
                    const embed = new EmbedBuilder()
                        .setColor('#F7F7F7') // Görseldeki beyaz/gri arka plana uygun
                        .setTitle(`Yasaklı Kullanıcı Listesi`)
                        .setDescription(descriptionContent.trim())
                        .setFooter({ text: `Sayfa ${embeds.length + 1}/${Math.ceil(totalBans / banCounter) + embeds.length} | ${new Date().toLocaleString('tr-TR')}` });
                    
                    embeds.push(embed);
                    
                    // Yeni sayfayı başlat
                    descriptionContent = entry;
                } else {
                    // Limite ulaşılmadıysa mevcut sayfaya ekle
                    descriptionContent += entry;
                }
                
                banCounter++;
            }
            
            // Döngü bittikten sonra kalan son içeriği de Embed olarak kaydet
            if (descriptionContent.length > 0) {
                const finalEmbed = new EmbedBuilder()
                    .setColor('#F7F7F7') 
                    .setTitle(`Yasaklı Kullanıcı Listesi`)
                    // Son Sayfada başlığı düzelt ve tarih ekle
                    .setDescription(descriptionContent.trim())
                    .setFooter({ text: `Sayfa ${embeds.length + 1}/${embeds.length + 1} | ${new Date().toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}` });

                embeds.push(finalEmbed);
            }
            // --- GÖRSEL FORMAT MANTIĞI SONU ---
            
            // Yanıtı sadece ilk Embed ile başlat ve diğer Embed'leri takip eden mesajlarla gönder
            await interaction.editReply({ embeds: [embeds[0]], ephemeral: true });

            // İlk Embed'den sonraki tüm Embed'leri ayrı mesajlar olarak gönder
            for (let i = 1; i < embeds.length; i++) {
                await interaction.followUp({ embeds: [embeds[i]], ephemeral: true });
            }

        } catch (error) {
            console.error('Banlist çekme hatası:', error);
            await interaction.editReply({ content: 'Yasaklı listesini çekerken beklenmedik bir hata oluştu.', ephemeral: true });
        }
    },
};
