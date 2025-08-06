const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

// Komutları oku ve yükle
const komutKlasoru = './commands';
const komutlar = [];
const yuklenenKomutlar = [];
const yuklenemeyenKomutlar = [];

fs.readdirSync(komutKlasoru).filter(file => file.endsWith('.js')).forEach(file => {
  try {
    const command = require(`${komutKlasoru}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
      yuklenenKomutlar.push(file);
    } else {
      yuklenemeyenKomutlar.push(`${file} (eksik "data" veya "execute")`);
    }
  } catch (error) {
    yuklenemeyenKomutlar.push(`${file} (yükleme hatası: ${error.message})`);
  }
});

// Yükleme sonuçlarını göster
console.log('📦 Komut yükleme tamamlandı.');
console.log(`✅ Yüklenen komutlar: ${yuklenenKomutlar.length > 0 ? yuklenenKomutlar.join(', ') : 'Yok'}`);
console.log(`❌ Yüklenemeyen komutlar: ${yuklenemeyenKomutlar.length > 0 ? yuklenemeyenKomutlar.join(', ') : 'Yok'}`);
client.once('ready', () => {
  console.log(`Bot aktif! (${client.user.tag})`);
});

// Botu login et
client.login(process.env.TOKEN);

// Basit express sunucu (Render veya benzeri platformlar için)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot çalışıyor!'));

app.listen(PORT, () => {
  console.log(`Web sunucusu ${PORT} portunda çalışıyor.`);
});
