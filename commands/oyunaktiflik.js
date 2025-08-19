const fetch = require("node-fetch"); // node-fetch@2

let robloxGameInfo = null; // Bilgileri tutacak değişken

// Roblox oyun aktiflik kontrolü
async function checkRobloxGame() {
    // ... (Önceki kodla aynı)
    const universeId = "91145006228484";
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

// Discord'da tabloyu at
// 'robloxGameInfo' değişkenini kullanıyor
async function sendRobloxStatus(channel) {
    if (!robloxGameInfo) return channel.send("❌ Roblox oyun bilgisi alınamadı.");

    const table = `
🎮 **TKA Asker Oyunu Aktiflik**
---------------------------------
👥 Oyuncular: **${robloxGameInfo.oyuncular}**
⭐ Favoriler: **${robloxGameInfo.favoriler}**
👀 Ziyaretler: **${robloxGameInfo.ziyaretler}**
🔗 [Oyuna Git](${robloxGameInfo.link})
---------------------------------
    `;
    await channel.send(table);
}

// Modülü dışa aktar ve client'ı al
module.exports = (client) => {
    client.once("ready", () => {
        console.log("✅ Roblox aktiflik sistemi başlatıldı!");

        const channelId = "KANAL_ID";
        const channel = client.channels.cache.get(channelId);
        if (!channel) return console.error("❌ Kanal bulunamadı!");

        setInterval(async () => {
            robloxGameInfo = await checkRobloxGame(); // Değişkeni güncelle
            sendRobloxStatus(channel); // Fonksiyonu çağır
        }, 10000); // her 10 saniye
    });
};
