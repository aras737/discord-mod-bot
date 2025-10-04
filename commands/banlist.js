const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Sunucudaki yasaklı kullanıcıların listesini gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
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

            const maxDescriptionLength = 4096;
            let descriptionContent = `Toplam yasaklı kullanıcı: **${totalBans}**\n\n`;
            let embeds = [];
            let banCounter = 1;

            for (const [userId, ban] of bans.entries()) {
                const userTag = ban.user.tag;
                let reason = ban.reason ? ban.reason : 'Sebep belirtilmedi';
                
                // Sebep 1024 karakteri geçerse kısalt
                if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

                const entry = 
                    `**${banCounter}. ${userTag}**\nID: ${userId}\nSebep: ${reason}\n\n`;

                if (descriptionContent.length + entry.length > maxDescriptionLength) {
                    // Embed oluştur
                    const embed = new EmbedBuilder()
                        .setColor('#F7F7F7')
                        .setTitle(`Yasaklı Kullanıcı Listesi`)
                        .setDescription(descriptionContent.trim())
                        .setFooter({ text: `Sayfa ${embeds.length + 1} | ${new Date().toLocaleString('tr-TR')}` });

                    embeds.push(embed);
                    descriptionContent = entry; // yeni sayfa başlat
                } else {
                    descriptionContent += entry;
                }

                banCounter++;
            }

            // Son sayfa
            if (descriptionContent.length > 0) {
                const finalEmbed = new EmbedBuilder()
                    .setColor('#F7F7F7')
                    .setTitle(`Yasaklı Kullanıcı Listesi`)
                    .setDescription(descriptionContent.trim())
                    .setFooter({ text: `Sayfa ${embeds.length + 1} | ${new Date().toLocaleString('tr-TR')}` });

                embeds.push(finalEmbed);
            }

            // Tüm embedleri tek tek gönder
            await interaction.editReply({ embeds: [embeds[0]] });
            for (let i = 1; i < embeds.length; i++) {
                await interaction.followUp({ embeds: [embeds[i]] });
            }

        } catch (error) {
            console.error('Banlist çekme hatası:', error);
            await interaction.editReply({ content: 'Yasaklı listesini çekerken bir hata oluştu.', ephemeral: false });
        }
    },
};
