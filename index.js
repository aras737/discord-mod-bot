// Gerekli modüller
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');

dotenv.config();

// Yeni Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Slash komutları için koleksiyon
client.commands = new Collection();
const komutlar = [];

// commands klasöründen komutları yükle
const komutKlasoru = path.join(__dirname, 'commands');

if (fs.existsSync(komutKlasoru)) {
  fs.readdirSync(komutKlasoru).filter(file => file.endsWith('.js')).forEach(file => {
    const command = require(`${komutKlasoru}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
    } else {
      console.warn(`[UYARI] ${file} komut dosyasında "data" veya "execute" eksik.`);
    }
  });
} else {
  console.warn('⚠️ "commands" klasörü bulunamadı. Komutlar yüklenemedi.');
}

// Bot hazır olduğunda
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🚮 Eski komutlar siliniyor...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: [] }); // Komutları sıfırla

    console.log('📝 Yeni komutlar yükleniyor...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlar });

    console.log('✅ Slash komutlar başarıyla yüklendi.');
  } catch (error) {
    console.error('❌ Komut yüklenirken hata oluştu:', error);
  }
});

// Slash komutları çalıştır
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Komut çalıştırma hatası: ${error}`);
    try {
      await interaction.reply({ content: '⚠️ Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
    } catch {
      // Eğer interaction zaten cevaplandıysa (acknowledged) bu hatayı yutarız
    }
  }
});

// Hata engelleyici
process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// Botu başlat
client.login(process.env.TOKEN);

// 🌐 Sahte port (Render için keep-alive)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot çalışıyor.');
});

app.listen(PORT, () => {
  console.log(`🌐 Sahte web sunucusu ${PORT} portunda çalışıyor.`);
});
