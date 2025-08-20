const { SlashCommandBuilder } = require("discord.js");
const fetch = require("node-fetch"); // node-fetch@2

// Roblox oyun aktiflik kontrolü
async function checkRobloxGame() {
    const universeId = "91145006228484"; // senin oyun ID
    const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            return null;
        }

        const game = data.data[0];
        return {
            oyuncular: game.playing,
            favoriler: game.favoritedCount,
            ziyaretler: game.visits,
            link: "https://www.roblox.com/tr/games/91145006228484/TKA-asker-oyunu"
        };
    } catch (err) {
        console.error("Roblox API hatası:", err);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("aktiflik")
        .setDescription("TKA asker oyununun aktifliğini gösterir"),

    async execute(interaction) {
        await interaction.deferReply();

        const info = await checkRobloxGame();
        if (!info) {
            return interaction.editReply("❌ Roblox oyun bilgisi alınamadı.");
        }

        const table = `
🎮 **TKA Asker Oyunu Aktiflik**
---------------------------------
👥 Oyuncular: **${info.oyuncular}**
⭐ Favoriler: **${info.favoriler}**
👀 Ziyaretler: **${info.ziyaretler}**
🔗 [Oyuna Git](${info.link})
---------------------------------
        `;

        await interaction.editReply(table);
    }
};
