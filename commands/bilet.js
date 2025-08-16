const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bilet")
        .setDescription("📩 Destek bileti panelini gönderir."),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("📩 Destek Talebi")
            .setDescription("Destek talebi oluşturmak için aşağıdaki butona tıklayın:");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("create_ticket")
                    .setLabel("🎫 Bilet Oluştur")
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
