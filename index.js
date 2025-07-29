const { Client, Intents } = require('discord.js');
const fs = require('fs');

// Discord bot için gerekli intents (izniler)
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

let config;

// Config.json'u oku, hata varsa sessizce geç
try {
  const data = fs.readFileSync('./config.json', 'utf8');
  config = JSON.parse(data);
} catch (error) {
  // Hata çıktıysa hiçbir şey yazma, sadece boş objeye çevir
  config = {};
}

// Bot hazır olduğunda konsola yaz
client.once('ready', () => {
  console.log('Bot aktif! Kullanıcı:', client.user.tag);
});

// Token varsa login yap, yoksa sessizce devam et
if (config.TOKEN) {
  client.login(config.TOKEN).catch(() => {
    // Girişte hata olursa da sessizce geç
  });
} else {
  console.log('Dikkat! TOKEN config.json içinde bulunamadı.');
}
