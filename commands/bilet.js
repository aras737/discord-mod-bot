const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bilet")
        .setDescription("📩 Destek bileti açma panelini gönderir"),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("📩 Destek Talebi")
            .setDescription("Destek talebi oluşturmak için aşağıdaki butona tıklayın:")
            .setColor("Blue");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("create_ticket")
                    .setLabel("🎫 Bilet Oluştur")
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
