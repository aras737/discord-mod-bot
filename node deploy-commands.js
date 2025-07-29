const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Slash komutları oku
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[UYARI] ${file} komutunda 'data' veya 'execute' eksik!`);
  }
}

// REST API ile gönder
const rest = new REST().setToken(process.env.TOKEN);

// Komutları yükle (geliştirici sunucusuna)
(async () => {
  try {
    console.log(`📦 ${commands.length} komut yükleniyor...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log(`✅ ${data.length} komut başarıyla yüklendi.`);
  } catch (error) {
    console.error(`❌ Slash komut yükleme hatası:`, error);
  }
})();
