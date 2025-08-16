const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const pages = [
    new EmbedBuilder()
        .setTitle('📚 Kılavuz - Sayfa 1/3')
        .setDescription('Resmi Kılavuzumuza Hoş Geldiniz!')
        .setColor('Blurple')
        .addFields(
            { name: '1️⃣ Genel Bilgiler', value: 'Bu botun ve sunucunun temel komutları hakkında bilgi verir.', inline: false },
            { name: '2️⃣ Rütbe Sistemi', value: 'Askeri rütbe sistemimiz ve kurallarımız hakkında bilgi verir.', inline: false },
            { name: '3️⃣ Kurallar', value: 'Sunucu kurallarımızı ve ihlal durumlarını anlatır.', inline: false }
        ),
    new EmbedBuilder()
        .setTitle('📚 Kılavuz - Sayfa 2/3: Rütbe Sistemi')
        .setDescription('Askeri rütbe sistemimiz ve yetkilerimiz aşağıda açıklanmıştır.')
        .setColor('Red')
        .addFields(
            { name: '💂 Rütbeler', value: '• Komutan\n• Üsteğmen\n• Teğmen\n• Er\n• Asker', inline: true },
            { name: '🎖️ Yetkiler', value: '• `duyuru`\n• `telsiz`\n• `rütbe`', inline: true }
        ),
    new EmbedBuilder()
        .setTitle('📚 Kılavuz - Sayfa 3/3: Sunucu Kuralları')
        .setDescription('Sunucuda huzurlu bir ortam için lütfen bu kurallara uyun.')
        .setColor('Green')
        .addFields(
            { name: '1. Küfür ve Hakaret', value: 'Kesinlikle yasaktır ve cezası süresiz susturulmadır.', inline: false },
            { name: '2. Spam', value: '5 dakikada 5\'ten fazla mesaj atmak spam sayılır ve ceza süresi 1 saattir.', inline: false },
            { name: '3. Reklam', value: 'Başka bir sunucunun veya markanın reklamını yapmak yasaktır ve kalıcı olarak yasaklanırsınız.', inline: false }
        ),
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kılavuz')
        .setDescription('Sunucu kılavuzunu görüntüler.'),
    async execute(interaction) {
        let currentPageIndex = 0;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous_page')
                .setLabel('◀️ Önceki')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('Sonraki ▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false)
        );

        await interaction.reply({
            embeds: [pages[currentPageIndex]],
            components: [row]
        });

        // Buton etkileşimlerini dinle
        const filter = i => i.customId === 'next_page' || i.customId === 'previous_page';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'next_page') {
                if (currentPageIndex < pages.length - 1) {
                    currentPageIndex++;
                }
            } else if (i.customId === 'previous_page') {
                if (currentPageIndex > 0) {
                    currentPageIndex--;
                }
            }

            const newRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous_page')
                    .setLabel('◀️ Önceki')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPageIndex === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Sonraki ▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPageIndex === pages.length - 1)
            );

            await i.update({
                embeds: [pages[currentPageIndex]],
                components: [newRow]
            });
        });

        collector.on('end', async collected => {
            const lastRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('disabled_buttons').setLabel('Kılavuz zaman aşımına uğradı.').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
            await interaction.editReply({ components: [lastRow] });
        });
    },
};
