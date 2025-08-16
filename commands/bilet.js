const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bilet')
        .setDescription('Bilet sistemi menüsünü açar.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('🎫 TKA Bilet Sistemi')
            .setDescription(
                "Destek almak için aşağıdaki **Butona** basınız.\n\n" +
                "📌 Kurallar:\n" +
                "1️⃣ Spam yapmayınız.\n" +
                "2️⃣ Açtığınız bilete sadece sizin ve yetkililerin erişimi olur.\n" +
                "3️⃣ Gereksiz yere bilet açmayınız."
            )
            .setFooter({ text: 'TKA Destek Sistemi' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket-create')
                .setLabel('🎟️ Bilet Aç')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
