require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const komutlar = [];
const komutYolu = path.join(__dirname, 'komutlar');
const dosyalar = fs.readdirSync(komutYolu).filter(file => file.endsWith('.js'));

for (const file of dosyalar) {
  const command = require(`./komutlar/${file}`);
  if (command.data) komutlar.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Komutlar Discord API’ye yükleniyor...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: komutlar }
    );

    console.log('✅ Slash komutları başarıyla yüklendi!');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
})();
