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
                    content: '✔ Bu sunucuda banlı kullanıcı bulunmuyor.',
                    ephemeral: false
                });
            }

            const now = new Date().toLocaleString('tr-TR');
            const max = 4096;

            let pages = [];
            let text = `Toplam yasaklı kullanıcı: **${totalBans}**\n\n`;

            let counter = 1;
            for (const [userId, ban] of bans) {
                const tag = ban.user?.tag || 'Bilinmeyen Kullanıcı';
                const reason = ban.reason || 'Sebep belirtilmedi';

                const entry =
                    `**${counter}.** ${tag}\n` +
                    `**ID:** ${userId}\n` +
                    `**Sebep:** ${reason}\n\n`;

                if (text.length + entry.length > max) {
                    pages.push(
                        new EmbedBuilder()
                            .setTitle('🚫 Yasaklı Kullanıcı Listesi')
                            .setColor('Red')
                            .setDescription(text.trim())
                            .setFooter({ text: `Sayfa ${pages.length + 1} | ${now}` })
                    );

                    text = entry;
                } else {
                    text += entry;
                }

                counter++;
            }

            // SON SAYFA
            if (text.length > 0) {
                pages.push(
                    new EmbedBuilder()
                        .setTitle('🚫 Yasaklı Kullanıcı Listesi')
                        .setColor('Red')
                        .setDescription(text.trim())
                        .setFooter({ text: `Sayfa ${pages.length + 1} | ${now}` })
                );
            }

            // Eğer hiçbir embed oluşmadıysa güvenlik
            if (pages.length === 0) {
                return interaction.editReply("❌ Bir hata oluştu, liste boş görünüyor.");
            }

            // İlk embed gönder
            await interaction.editReply({ embeds: [pages[0]] });

            // Diğer sayfalar
            for (let i = 1; i < pages.length; i++) {
                await new Promise(r => setTimeout(r, 500)); // Spam koruma
                await interaction.followUp({ embeds: [pages[i]] });
            }

        } catch (err) {
            console.error("Ban listesi hatası:", err);
            const msg = `❌ Ban listesi alınırken bir hata oluştu:\n\`\`\`${err.message}\`\`\``;

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: msg, ephemeral: false });
            } else {
                await interaction.reply({ content: msg, ephemeral: false });
            }
        }
    },
};
