// /commands/oyunaktiflik.js
const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

const data = new SlashCommandBuilder()
    .setName('oyun-durumu')
    .setDescription('Roblox oyununun anlık durumunu gösterir.');

async function execute(interaction) {
    await interaction.deferReply(); // Cevap gönderilene kadar bekle

    const universeId = "91145006228484";
    const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Roblox API'den hata kodu alındı: ${res.status} - ${res.statusText}`);
            return interaction.editReply("❌ Roblox API'den bilgi alınamadı.");
        }
        
        const data = await res.json();
        const game = data.data[0];

        if (!game) {
            return interaction.editReply("❌ Oyun bilgisi bulunamadı! Universe ID'yi kontrol edin.");
        }

        const table = `
🎮 **TKA Asker Oyunu Anlık Durum**
---------------------------------
👥 Oyuncular: **${game.playing}**
⭐ Favoriler: **${game.favoritedCount}**
👀 Ziyaretler: **${game.visits}**
🔗 [Oyuna Git](${game.link})
---------------------------------
        `;

        await interaction.editReply(table);
    } catch (err) {
        console.error("Roblox API hatası:", err);
        await interaction.editReply("❌ Bir hata oluştu ve oyun bilgisi alınamadı.");
    }
}

module.exports = {
    data,
    execute,
};
