const { 
    SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    EmbedBuilder, StringSelectMenuBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bilet')
        .setDescription('Bilet sistemi için menü gönderir.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(' Destek Sistemi')
            .setDescription(
                'Bir sorun yaşıyorsanız veya yardım almak istiyorsanız aşağıdaki menüden bir kategori seçerek bilet açabilirsiniz.\n\n' +
                '⚠️ Sadece **1 aktif bilet** açabilirsiniz.'
            )
            .setColor('Blue');

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_menu')
            .setPlaceholder('Bir kategori seçin...')
            .addOptions([
                { label: ' Destek', value: 'destek', description: 'Genel yardım almak için.' },
                { label: ' Ödeme', value: 'odeme', description: 'Ödeme & bağış sorunları için.' },
                { label: ' Şikayet', value: 'sikayet', description: 'Bir kullanıcıyı şikayet etmek için.' },
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
