const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

let codes = {};
if (fs.existsSync("./codes.json")) {
    codes = JSON.parse(fs.readFileSync("./codes.json", "utf8"));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Doğrulama kodu al"),
    async execute(interaction) {
        const userId = interaction.user.id;

        // Yeni kod üret
        const code = "TKA " + Math.floor(1000 + Math.random() * 9000);
        const expiresAt = Date.now() + 2 * 60 * 1000; // 2 dakika

        codes[userId] = { code, expiresAt };
        fs.writeFileSync("./codes.json", JSON.stringify(codes, null, 4));

        const embed = new EmbedBuilder()
            .setTitle("Doğrulama Kodu")
            .setDescription(`Kodunuz: **${code}**\nBu kod **2 dakika** geçerli.`)
            .setColor("Green");

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
