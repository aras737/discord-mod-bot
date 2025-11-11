const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Sunucudaki yasaklı kullanıcıların listesini gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false }); // herkes görebilir ✅

        try {
            const bans = await interaction.guild.bans.fetch();
            const totalBans = bans.size;

            if (totalBans === 0) {
                return interaction.editReply({ 
                    content: '❌ Bu sunucuda şu anda yasaklı kullanıcı bulunmamaktadır.',
                    ephemeral: false // herkes görebilir ✅
                });
            }

            const maxDescriptionLength = 4096;
            let descriptionContent = `Toplam yasaklı kullanıcı: **${totalBans}**\n\n`;
            let embeds = [];
            let banCounter = 1;
            const now = new Date().toLocaleString('tr-TR');

            for (const [userId, ban] of bans.entries()) {
                const userTag = ban.user?.tag || 'Bilinmeyen Kullanıcı';
                let reason = ban.reason ? ban.reason : 'Sebep belirtilmedi';
                if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

                const entry = `**${banCounter}. ${userTag}**\nID: ${userId}\nSebep: ${reason}\n\n`;

                if (descriptionContent.length + entry.length > maxDescriptionLength) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(`Yasaklı Kullanıcı Listesi`)
                        .setDescription(descriptionContent.trim())
                        .setFooter({ text: `Sayfa ${embeds.length + 1} | ${now}` });

                    embeds.push(embed);
                    descriptionContent = entry;
                } else {
                    descriptionContent += entry;
                }
                banCounter++;
            }

            if (descriptionContent.length > 0) {
                const finalEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`Yasaklı Kullanıcı Listesi`)
                    .setDescription(descriptionContent.trim())
                    .setFooter({ text: `Sayfa ${embeds.length + 1} | ${now}` });

                embeds.push(finalEmbed);
            }

            await interaction.editReply({ embeds: [embeds[0]], ephemeral: false }); // herkes görebilir ✅
            for (let i = 1; i < embeds.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await interaction.followUp({ embeds: [embeds[i]], ephemeral: false }); // herkes görebilir ✅
            }

        } catch (error) {
            console.error('Banlist çekme hatası:', error);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ 
                    content: `❌ Yasaklı listesini çekerken bir hata oluştu:\n\`\`\`${error.message}\`\`\``, 
                    ephemeral: false // herkes görebilir ✅
                });
            } else {
                await interaction.reply({ 
                    content: `❌ Yasaklı listesini çekerken bir hata oluştu:\n\`\`\`${error.message}\`\`\``, 
                    ephemeral: false // herkes görebilir ✅
                });
            }
        }
    },
};
