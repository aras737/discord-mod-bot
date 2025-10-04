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

            if (bans.size === 0) {
                return interaction.editReply({ 
                    content: 'Bu sunucuda şu anda yasaklı kullanıcı bulunmamaktadır.',
                    ephemeral: true
                });
            }

            // --- SAYFALAMA MANTIĞI BAŞLANGICI ---
            const maxContentLength = 1000; // Güvenli bir sınır (1024'ten biraz az)
            const banDetails = []; // Tüm kullanıcı detaylarını tutacak dizi
            let currentContent = '';
            let pageNumber = 1;
            const embeds = []; // Oluşturulan tüm Embed'leri tutacak dizi

            // Tüm yasaklıları döngüye al
            for (const [userId, ban] of bans.entries()) {
                const userTag = ban.user.tag;
                const reason = ban.reason ? ban.reason.substring(0, 75) + (ban.reason.length > 75 ? '...' : '') : 'Sebep belirtilmedi';
                
                // Her bir yasaklı için oluşturulan metin satırı
                const entry = `**${userTag}** (ID: ${userId})\n> Sebep: *${reason}*\n`;
                
                // Eğer mevcut içerik + yeni giriş, limiti aşacaksa
                if (currentContent.length + entry.length > maxContentLength) {
                    
                    // Önceki sayfayı Embed olarak kaydet
                    const embed = new EmbedBuilder()
                        .setColor('#2C3E50')
                        .setTitle(`Sunucu Yasaklama Kaydı (Sayfa ${pageNumber})`)
                        .setDescription(`Toplam **${bans.size}** yasaklı kullanıcı bulunmaktadır.`)
                        .addFields({
                            name: `Yasaklı Kullanıcılar:`, 
                            value: currentContent || 'Liste bilgisi çekilemedi.',
                            inline: false
                        })
                        .setFooter({ text: `Sayfa ${pageNumber}` });
                    
                    embeds.push(embed);
                    
                    // Yeni sayfayı başlat
                    currentContent = entry;
                    pageNumber++;
                } else {
                    // Limite ulaşılmadıysa mevcut sayfaya ekle
                    currentContent += entry;
                }
            }
            
            // Döngü bittikten sonra kalan son içeriği de Embed olarak kaydet
            if (currentContent.length > 0) {
                const finalEmbed = new EmbedBuilder()
                    .setColor('#2C3E50')
                    .setTitle(`Sunucu Yasaklama Kaydı (Sayfa ${pageNumber})`)
                    .setDescription(`Toplam **${bans.size}** yasaklı kullanıcı bulunmaktadır.`)
                    .addFields({
                        name: `Yasaklı Kullanıcılar:`, 
                        value: currentContent || 'Liste bilgisi çekilemedi.',
                        inline: false
                    })
                    .setFooter({ text: `Sayfa ${pageNumber}` })
                    .setTimestamp();
                
                embeds.push(finalEmbed);
            }
            // --- SAYFALAMA MANTIĞI SONU ---


            // Oluşturulan tüm embed'leri gönder (Discord tek mesajda 10'a kadar Embed destekler)
            // Eğer 10'dan fazla sayfa olursa, bu mantığı daha da geliştirmen gerekir (birden fazla mesaj göndermek gibi).
            await interaction.editReply({ embeds: embeds, ephemeral: true });

        } catch (error) {
            console.error('Banlist çekme hatası:', error);
            // Hatayı daha anlaşılır yapalım
            await interaction.editReply({ content: 'Yasaklı listesini çekerken beklenmedik bir hata oluştu. Lütfen logları kontrol edin.', ephemeral: true });
        }
    },
};
