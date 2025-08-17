const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bilet')
        .setDescription('Bilet sistemi panelini gönderir'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('🎫 Destek Sistemi')
            .setDescription('📩 Aşağıdaki butona tıklayarak bir bilet açabilirsiniz.\nYetkililer en kısa sürede sizinle ilgilenecektir.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('bilet-ac')
                .setLabel('📩 Bilet Aç')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
