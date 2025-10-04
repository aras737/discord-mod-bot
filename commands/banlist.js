const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Sunucudaki yasaklı kullanıcıların listesini gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Cevabı başlatıyoruz
        await interaction.deferReply({ ephemeral: false });

        try {
            // Yasaklı kullanıcıları çek
            const bans = await interaction.guild.bans.fetch();
            const totalBans = bans.size;

            if (totalBans === 0) {
                return interaction.editReply({ 
                    content: '❌ Bu sunucuda şu anda yasaklı kullanıcı bulunmamaktadır.',
                    ephemeral: false
                });
            }

            const maxDescriptionLength = 4096; // Discord embed limit
            let descriptionContent = `Toplam yasaklı kullanıcı: **${totalBans}**\n\n`;
            let embeds = [];
            let banCounter = 1;

            for (const [userId, ban] of bans.entries()) {
                const userTag = ban.user.tag;
                let reason = ban.reason ? ban.reason : 'Sebep belirtilmedi';
                
                // Çok uzun sebepleri kısalt
                if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

                const entry = 
                    `**${banCounter}. ${userTag}**\nID: ${userId}\nSebep: ${reason}\n\n`;

                // Eğer mevcut açıklamaya sığmıyorsa yeni embed oluştur
                if (descriptionContent.length + entry.length > maxDescriptionLength) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(`Yasaklı Kullanıcı Listesi`)
                        .setDescription(descriptionContent.trim())
                        .setFooter({ text: `Sayfa ${embeds.length + 1} | ${new Date().toLocaleString('tr-TR')}` });

                    embeds.push(embed);
                    descriptionContent = entry;
                } else {
                    descriptionContent += entry;
                }

                banCounter++;
            }

            // Son sayfayı ekle
            if (descriptionContent.length > 0) {
                const finalEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`Yasaklı Kullanıcı Listesi`)
                    .setDescription(descriptionContent.trim())
                    .setFooter({ text: `Sayfa ${embeds.length + 1} | ${new Date().toLocaleString('tr-TR')}` });

                embeds.push(finalEmbed);
            }

            // İlk sayfayı gönder
            await interaction.editReply({ embeds: [embeds[0]] });

            // Geri kalan sayfaları takip eden mesajlarla gönder
            for (let i = 1; i < embeds.length; i++) {
                await interaction.followUp({ embeds: [embeds[i]] });
            }

        } catch (error) {
            console.error('Banlist çekme hatası:', error);

            // Kullanıcıya görünür hata mesajı
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ 
                    content: `❌ Yasaklı listesini çekerken bir hata oluştu:\n\`\`\`${error.message}\`\`\``, 
                    ephemeral: false 
                });
            } else {
                await interaction.reply({ 
                    content: `❌ Yasaklı listesini çekerken bir hata oluştu:\n\`\`\`${error.message}\`\`\``, 
                    ephemeral: false 
                });
            }
        }
    },
};
