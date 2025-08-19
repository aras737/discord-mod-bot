// oyunaktiflik.js
const fetch = require("node-fetch"); // node-fetch@2

// Roblox oyun aktiflik kontrolü
async function checkRobloxGame() {
    const universeId = "91145006228484"; // Senin oyun ID'n
    const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            console.log("❌ Oyun bulunamadı!");
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

// Discord'da tabloyu at
async function sendRobloxStatus(channel) {
    const info = await checkRobloxGame();
    if (!info) return channel.send("❌ Roblox oyun bilgisi alınamadı.");

    const table = `
🎮 **TKA Asker Oyunu Aktiflik**
---------------------------------
👥 Oyuncular: **${info.oyuncular}**
⭐ Favoriler: **${info.favoriler}**
👀 Ziyaretler: **${info.ziyaretler}**
🔗 [Oyuna Git](${info.link})
---------------------------------
    `;

    await channel.send(table);
}

// Modülü dışa aktararak client parametresini almasını sağlayın
module.exports = (client) => {
    // Bot açıldığında her 10 saniyede bir tabloyu güncelle
    client.once("ready", () => {
        console.log("✅ Roblox aktiflik sistemi başlatıldı!");

        const channelId = "KANAL_ID"; // Aktifliğin atılacağı kanal ID'si
        const channel = client.channels.cache.get(channelId);
        if (!channel) return console.error("❌ Kanal bulunamadı!");

        setInterval(() => {
            sendRobloxStatus(channel);
        }, 10000); // Her 10 saniye
    });
};
