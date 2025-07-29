const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Komutları oku
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[UYARI] ${file} geçersiz komut içeriyor.`);
  }
}

// REST API
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🌐 Global komutlar yükleniyor...');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    const now = new Date();
    const saat = now.toLocaleTimeString();
    const tarih = now.toLocaleDateString();

    console.log(`✅ Komutlar global olarak yüklendi | ${tarih} - ${saat}`);
    console.log('⚠️ Not: Global komutlar birkaç dakika içinde aktif olur (1-60 dk arası).');

  } catch (error) {
    console.error('🚫 Hata oluştu:', error);
  }
})();
