const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Sunucudaki yasaklı kullanıcıların listesini gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // ✅ Herkes görebilir
        await interaction.deferReply({ ephemeral: false });

        try {
            const bans = await interaction.guild.bans.fetch();
            const totalBans = bans.size;

            if (totalBans === 0) {
                return interaction.editReply({ 
                    content: 'Bu sunucuda şu anda yasaklı kullanıcı bulunmamaktadır.',
                    ephemeral: false
                });
            }

            const maxDescriptionLength = 4096; // Discord embed karakter limiti
            let descriptionContent = `Toplam yasaklı kullanıcı: **${totalBans}**\n\n`;
            let embeds = [];
            let counter = 1;
            const now = new Date().toLocaleString('tr-TR');

            for (const [userId, ban] of bans.entries()) {
                const userTag = ban.user?.tag || 'Bilinmeyen Kullanıcı';
                const reason = ban.reason || 'Sebep belirtilmedi';
                
                const entry = `**${counter}.** ${userTag}\n**ID:** ${userId}\n**Sebep:** ${reason}\n\n`;

                if (descriptionContent.length + entry.length > maxDescriptionLength) {
                    embeds.push(new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Yasaklı Kullanıcı Listesi')
                        .setDescription(descriptionContent.trim())
                        .setFooter({ text: `Sayfa ${embeds.length + 1} | ${now}` })
                    );
                    descriptionContent = entry;
                } else {
                    descriptionContent += entry;
                }
                counter++;
            }

            // Son sayfa ekle
            if (descriptionContent.length > 0) {
                embeds.push(new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Yasaklı Kullanıcı Listesi')
                    .setDescription(descriptionContent.trim())
                    .setFooter({ text: `Sayfa ${embeds.length + 1} | ${now}` })
                );
            }

            // Hepsini sırayla gönder
            await interaction.editReply({ embeds: [embeds[0]] });
            for (let i = 1; i < embeds.length; i++) {
                await new Promise(r => setTimeout(r, 1000)); // 1 saniye aralık
                await interaction.followUp({ embeds: [embeds[i]] });
            }

        } catch (err) {
            console.error('Ban listesi hatası:', err);
            const msg = `Yasaklı listesini çekerken bir hata oluştu:\n\`\`\`${err.message}\`\`\``;
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: msg, ephemeral: false });
            } else {
                await interaction.reply({ content: msg, ephemeral: false });
            }
        }
    },
};
