const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Komutları hazırla
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[UYARI] ${file} komutu eksik!`);
  }
}

// GUILD ID'ni buraya yaz!
const GUILD_ID = '1394407092106039307';
const CLIENT_ID = '1394428101366255656';

const rest = new REST().setToken(process.env.TOKEN);

// Komutları yükle
(async () => {
  try {
    console.log(`🔃 Komutlar yükleniyor...`);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`✅ Komutlar başarıyla yüklendi.`);
  } catch (error) {
    console.error(`❌ Komut yüklemede hata:`, error);
  }
})();
