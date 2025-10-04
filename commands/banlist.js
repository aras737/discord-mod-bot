const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    // Komut Verisi
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Sunucudaki yasaklı kullanıcıların listesini gösterir.')
        // Yetki kontrolü: Sadece BanMembers izni olanlar kullanabilir.
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), 

    // Çalıştırma Fonksiyonu
    async execute(interaction) {
        // Yanıt süresi aşılmaması için bekleme mesajı gönderilir.
        await interaction.deferReply({ ephemeral: true }); 

        try {
            // Sunucunun tüm yasaklı kullanıcılarını çek
            const bans = await interaction.guild.bans.fetch();

            // Yasaklı kullanıcı yoksa
            if (bans.size === 0) {
                return interaction.editReply({ 
                    content: 'Bu sunucuda şu anda yasaklı kullanıcı bulunmamaktadır.',
                    ephemeral: true
                });
            }

            // Embed alanına sığacak şekilde listeyi hazırlarız.
            let banListContent = '';
            let count = 0;
            const maxListCount = 20; // Discord Embed alanını taşmamak için 20 kişi ile sınırla

            // Yasaklılar üzerinde döngü yaparak bilgileri topla
            for (const [userId, ban] of bans.entries()) {
                if (count >= maxListCount) {
                    banListContent += `\n...ve diğer **${bans.size - maxListCount}** kullanıcı.`;
                    break;
                }

                const userTag = ban.user.tag;
                // Sebep çok uzunsa kısaltılır.
                const reason = ban.reason ? ban.reason.substring(0, 40) + (ban.reason.length > 40 ? '...' : '') : 'Sebep belirtilmedi';
                
                // Listeye ekle
                banListContent += `**${userTag}** (ID: ${userId})\n> Sebep: *${reason}*\n`;
                count++;
            }
            
            // Embed oluşturma
            const banListEmbed = new EmbedBuilder()
                .setColor('#2C3E50') // Kurumsal, net tema rengi
                .setTitle(`Sunucu Yasaklama Kaydı`)
                .setDescription(`Bu sunucuda toplam **${bans.size}** yasaklı kullanıcı bulunmaktadır.`)
                .addFields({
                    name: `Detaylı Kayıtlar: (İlk ${count} Kullanıcı)`, 
                    value: banListContent || 'Yasaklı listesi bilgisi çekilemedi.',
                    inline: false
                })
                .setFooter({ text: `Denetleyen Yetkili: ${interaction.user.tag}` })
                .setTimestamp();
            
            // Sonucu sadece yetkiliye gönder
            await interaction.editReply({ embeds: [banListEmbed], ephemeral: true });

        } catch (error) {
            console.error('Banlist çekme hatası:', error);
            await interaction.editReply({ content: 'Yasaklı listesini çekerken bir API hatası oluştu.', ephemeral: true });
        }
    },
};
