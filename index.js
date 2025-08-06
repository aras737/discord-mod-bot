const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();
const komutlar = [];
const komutKlasoru = path.join(__dirname, 'komutlar');
const yuklenenler = [];
const yuklenemeyenler = [];

// Komutları oku
fs.readdirSync(komutKlasoru).filter(file => file.endsWith('.js')).forEach(file => {
  try {
    const command = require(path.join(komutKlasoru, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
      yuklenenler.push(file);
    } else {
      yuklenemeyenler.push(`${file} (Eksik data/execute)`);
    }
  } catch (e) {
    yuklenemeyenler.push(`${file} (yükleme hatası: ${e.message})`);
  }
});

client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('♻️ Slash komutlar yükleniyor...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: komutlar });
    console.log('📦 Komut yükleme tamamlandı.');
    console.log(`✅ Yüklenen komutlar: ${yuklenenler.length > 0 ? yuklenenler.join(', ') : 'Yok'}`);
    console.log(`❌ Yüklenemeyen komutlar: ${yuklenemeyenler.length > 0 ? yuklenemeyenler.join(', ') : 'Yok'}`);
  } catch (err) {
    console.error('❌ Slash komutlar yüklenirken hata:', err);
  }
});

// Slash komut çalıştırıcı
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ Komut çalıştırma hatası: ${err}`);
    await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
  }
});

// Hata engelleyici
process.on('unhandledRejection', err => console.error('🚨 Unhandled Rejection:', err));
process.on('uncaughtException', err => console.error('🚨 Uncaught Exception:', err));

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot Aktif!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web sunucu port ${PORT} üzerinden çalışıyor.`);
});

// Botu başlat
client.login(process.env.TOKEN);
