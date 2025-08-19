const fetch = require("node-fetch"); // node-fetch@2

// Roblox oyun aktiflik kontrolü
async function checkRobloxGame() {
    const universeId = "91145006228484";
    const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const game = data.data[0];
        if (!game) {
            return null;
        }
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

// Bot başladığında çalışacak ana fonksiyon
module.exports = (client) => {
    client.once("ready", async () => {
        console.log("✅ Roblox aktiflik sistemi başlatıldı!");

        const channelId = "KANAL_ID"; // Aktiflik mesajının atılacağı kanal ID'si
        const channel = client.channels.cache.get(channelId);
        if (!channel) return console.error("❌ Kanal bulunamadı!");

        let statusMessage = null; // Mesajı tutacak değişken

        // Mesajı ilk kez gönder
        const info = await checkRobloxGame();
        if (info) {
            const table = `
🎮 **TKA Asker Oyunu Aktiflik**
---------------------------------
👥 Oyuncular: **${info.oyuncular}**
⭐ Favoriler: **${info.favoriler}**
👀 Ziyaretler: **${info.ziyaretler}**
🔗 [Oyuna Git](${info.link})
---------------------------------
            `;
            statusMessage = await channel.send(table);
        } else {
            statusMessage = await channel.send("❌ Roblox oyun bilgisi alınamadı.");
        }

        // Her 10 saniyede bir mesajı düzenle
        setInterval(async () => {
            const updatedInfo = await checkRobloxGame();
            if (updatedInfo && statusMessage) {
                const updatedTable = `
🎮 **TKA Asker Oyunu Aktiflik**
---------------------------------
👥 Oyuncular: **${updatedInfo.oyuncular}**
⭐ Favoriler: **${updatedInfo.favoriler}**
👀 Ziyaretler: **${updatedInfo.ziyaretler}**
🔗 [Oyuna Git](${updatedInfo.link})
---------------------------------
                `;
                try {
                    await statusMessage.edit(updatedTable);
                } catch (error) {
                    console.error("Mesaj düzenlenirken bir hata oluştu:", error);
                    // Eğer mesaj silinirse, tekrar oluştur
                    statusMessage = await channel.send(updatedTable);
                }
            }
        }, 10000); // Her 10 saniye
    });
};
