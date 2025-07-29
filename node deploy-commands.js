require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Gerekli değişkenler
const clientId = 'BOT_ID_HERE'; // BOT ID'ni buraya yaz
const guildId = 'GUILD_ID_HERE'; // TEST sunucunun ID'sini buraya yaz (global yüklenecekse kaldır)

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[UYARI] ${filePath} geçerli bir komut değil.`);
  }
}

// Discord REST API
const rest = new REST().setToken(process.env.TOKEN);

// Komutları yükle
(async () => {
  try {
    console.log(`⏳ ${commands.length} komut yükleniyor...`);

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId), // test sunucusu için
      // Routes.applicationCommands(clientId), // global yüklenecekse bu satırı kullan
      { body: commands },
    );

    console.log('✅ Komutlar başarıyla yüklendi.');
  } catch (error) {
    console.error('🚨 Komut yükleme hatası:', error);
  }
})();
