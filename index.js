const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');

dotenv.config();

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

const komutKlasoru = path.join(__dirname, 'commands');

if (fs.existsSync(komutKlasoru)) {
  fs.readdirSync(komutKlasoru).filter(f => f.endsWith('.js')).forEach(file => {
    const command = require(path.join(komutKlasoru, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
    } else {
      console.warn(`[UYARI] ${file} dosyasında data veya execute eksik.`);
    }
  });
} else {
  console.warn('⚠️ "commands" klasörü bulunamadı.');
}

client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    // **ESKİ KOMUTLARI SİLMEYİP** direkt yeni komutları API'ye yüklüyoruz
    console.log('📝 Komutlar Discord API\'ye yükleniyor/güncelleniyor...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlar });
    console.log('✅ Slash komutlar başarıyla yüklendi.');
  } catch (error) {
    console.error('❌ Komut yüklerken hata:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Komut çalıştırma hatası:`, error);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: '⚠️ Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
      } catch {}
    }
  }
});

process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🚨 Unhandled Rejection:', reason);
});

client.login(process.env.TOKEN).catch(err => {
  console.error('❌ Bot token ile giriş yapılamadı:', err);
});

// Sahte express sunucu, Render ve benzeri servislerde uyanık tutar
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot çalışıyor.'));
app.listen(PORT, () => console.log(`🌐 Web sunucusu ${PORT} portunda aktif.`));
