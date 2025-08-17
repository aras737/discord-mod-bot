const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bilet')
        .setDescription('Bilet sistemi için buton gönderir.'),

    async execute(interaction) {
        // Embed
        const embed = new EmbedBuilder()
            .setTitle('🎫 Destek Sistemi')
            .setDescription('Bir sorun yaşıyorsanız veya yardım almak istiyorsanız aşağıdaki butona basarak bir bilet açabilirsiniz.\n\n⚠️ Sadece **1 aktif bilet** açabilirsiniz.')
            .setColor('Blue');

        // Buton
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('📩 Bilet Aç')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
