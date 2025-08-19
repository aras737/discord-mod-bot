const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const gameUrl = "https://www.roblox.com/tr/games/91145006228484/TKA-asker-oyunu";
const placeId = "91145006228484";

// Hangi kanalda gözükecek?
const aktiflikChannelId = "KANAL_ID"; // buraya kanal ID'ni yaz
let aktiflikMesaji;

async function guncelleAktiflik(client) {
    try {
        const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${placeId}`);
        const data = await response.json();

        if (!data.data || data.data.length === 0) return;
        const game = data.data[0];

        const embed = new EmbedBuilder()
            .setTitle("🎮 TKA Asker Oyunu Aktiflik")
            .setURL(gameUrl)
            .setColor("Blue")
            .addFields(
                { name: "👥 Aktif Oyuncular", value: `${game.playing.toLocaleString()} kişi`, inline: true },
                { name: "⭐ Favoriler", value: `${game.favoritedCount.toLocaleString()} kişi`, inline: true },
                { name: "👀 Toplam Ziyaret", value: `${game.visits.toLocaleString()} kez`, inline: true }
            )
            .setFooter({ text: "Her saniye güncelleniyor 🔄" })
            .setTimestamp();

        if (!aktiflikMesaji) {
            const channel = await client.channels.fetch(aktiflikChannelId);
            aktiflikMesaji = await channel.send({ embeds: [embed] });
        } else {
            await aktiflikMesaji.edit({ embeds: [embed] });
        }

    } catch (err) {
        console.error("Aktiflik güncelleme hatası:", err);
    }
}

// Bot hazır olduğunda başlat
client.once("ready", () => {
    console.log("🔄 Aktiflik tablosu başlatıldı.");
    setInterval(() => guncelleAktiflik(client), 1000); // her 1 saniye
});
