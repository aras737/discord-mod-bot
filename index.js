// Gerekli modüller
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');

dotenv.config(); // .env dosyasını yükle

// Discord Client oluşturma, gerekli intentlerle
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Sunucu bilgileri için
    GatewayIntentBits.GuildMessages,    // Mesajlar için
    GatewayIntentBits.MessageContent,   // Mesaj içeriği için
    GatewayIntentBits.GuildMembers      // Üye bilgileri için (rol kontrol vs)
  ]
});

// Komutlar için koleksiyon ve JSON formatında komutları tutacak dizi
client.commands = new Collection();
const komutlar = [];

// Komutların bulunduğu klasör yolu
const komutKlasoru = path.join(__dirname, 'commands');

// Komutları yükleme fonksiyonu
function komutlariYukle() {
  if (!fs.existsSync(komutKlasoru)) {
    console.warn('⚠️ "commands" klasörü bulunamadı. Komutlar yüklenemedi.');
    return;
  }

  // commands klasöründeki .js dosyalarını oku
  const files = fs.readdirSync(komutKlasoru).filter(file => file.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(komutKlasoru, file);
    try {
      const command = require(filePath);
      // Komut nesnesinde data ve execute olmalı
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        komutlar.push(command.data.toJSON());
      } else {
        console.warn(`[UYARI] ${file} komut dosyasında "data" veya "execute" metodu eksik.`);
      }
    } catch (err) {
      console.error(`[HATA] ${file} komut dosyası yüklenirken hata oluştu:`, err);
    }
  }
}

// Komutları yükle
komutlariYukle();

// Bot hazır olduğunda çalışacak kısım
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    // Eski komutları silmeden, komutları API'ye yükle/güncelle
    console.log('📝 Komutlar API\'ye yükleniyor veya güncelleniyor...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlar });

    console.log('✅ Slash komutlar başarıyla yüklendi.');
  } catch (error) {
    console.error('❌ Komut yüklenirken hata oluştu:', error);
  }
});

// Slash komut tetiklendiğinde
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[UYARI] ${interaction.commandName} adında bir komut bulunamadı.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Komut çalıştırılırken hata oluştu: ${error}`);

    if (interaction.replied || interaction.deferred) {
      // Eğer cevap verilmişse tekrar cevap veremez, hata yutulur
      return;
    }

    try {
      await interaction.reply({ content: '⚠️ Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
    } catch {
      // Eğer yine cevap verilemezse sessizce geç
    }
  }
});

// Global hata yakalayıcılar (programın çökmesini önler)
process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// Botu başlat (token .env içinde olmalı)
client.login(process.env.TOKEN).catch(err => {
  console.error('❌ Bot giriş yaparken hata oluştu:', err);
});

// Render veya benzeri servislerde botun uyanık kalması için basit web sunucusu
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot çalışıyor.');
});

app.listen(PORT, () => {
  console.log(`🌐 Sahte web sunucusu ${PORT} portunda çalışıyor.`);
});
