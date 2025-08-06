// Gerekli modüller
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Express (uptime için sessiz sunucu)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Aktif!'));
app.listen(PORT, () => {
  console.log(`🌐 Express portu dinleniyor: ${PORT}`);
});

// Discord client ayarları
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Slash komut sistemi
client.commands = new Collection();
const komutYolu = './komutlar';
const commands = [];

try {
  const dosyalar = fs.readdirSync(komutYolu).filter(file => file.endsWith('.js'));

  if (dosyalar.length === 0) {
    console.warn('⚠️ Yüklenecek komut bulunamadı.');
  } else {
    console.log(`📦 ${dosyalar.length} komut bulunuyor. Yükleniyor...`);
  }

  for (const file of dosyalar) {
    const command = require(`${komutYolu}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Komut eksik: ${file}`);
    }
  }
} catch (err) {
  console.error('❌ Komutlar okunamadı:', err);
}

// Bot hazır olunca
client.once('ready', async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash komutlar başarıyla yüklendi.');
  } catch (error) {
    console.error('❌ Komutlar yüklenirken hata:', error);
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
    console.error(`❌ Komut hatası: ${error}`);
    await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
  }
});

// Hata engelleyici
process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// Giriş yap
client.login(process.env.TOKEN);
