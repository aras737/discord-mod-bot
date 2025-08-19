const fetch = require('node-fetch');

// Roblox oyun aktiflik kontrolü
async function checkRobloxGameStatus() {
    const universeId = "91145006228484";
    const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;

    console.log("Roblox oyun durumu kontrol ediliyor...");

    try {
        const res = await fetch(url);

        if (!res.ok) {
            console.error(`❌ Roblox API'den hata kodu alındı: ${res.status} - ${res.statusText}`);
            return;
        }

        const data = await res.json();
        const game = data.data[0];

        if (!game) {
            console.log("❌ Oyun bilgisi bulunamadı! Evren ID'sini kontrol edin.");
            return;
        }

        console.log(`✅ Oyun bulundu: TKA Asker Oyunu`);
        console.log(`👥 Oyuncular: ${game.playing}`);
        console.log(`⭐ Favoriler: ${game.favoritedCount}`);
        console.log(`👀 Ziyaretler: ${game.visits}`);
        console.log(`🔗 Link: https://www.roblox.com/games/${universeId}`);

    } catch (err) {
        console.error("❌ Roblox API'ye bağlanırken bir hata oluştu:", err);
    }
}

// Fonksiyonu çalıştır
checkRobloxGameStatus();
