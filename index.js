// 📦 Gerekli modüller
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');
const express = require('express');

// 🌍 Ortam değişkenlerini yükle
dotenv.config();

// 🤖 Discord client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// 🗂 Komutlar koleksiyonu
client.commands = new Collection();
const komutlar = [];
const komutKlasoru = './komutlar'; // komutlar dizini burada `commands`

// ✅ Komutları oku
if (fs.existsSync(komutKlasoru)) {
  const komutDosyalari = fs.readdirSync(komutKlasoru).filter(file => file.endsWith('.js'));

  console.log(`📦 ${komutDosyalari.length} komut bulunuyor. Yükleniyor...`);

  komutDosyalari.forEach(file => {
    const command = require(`${komutKlasoru}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
      console.warn(`⚠️  ${file} dosyasında 'data' veya 'execute' eksik.`);
    }
  });
} else {
  console.warn(`🚫 Komut klasörü bulunamadı: ${komutKlasoru}`);
}

// 🔄 Komutları Discord'a gönder
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlar });
    console.log(`✅ ${komutlar.length} komut başarıyla Discord API'ye yüklendi.`);
  } catch (error) {
    console.error('❌ Komutlar yüklenirken hata:', error);
  }
});

// 💬 Slash komutlarını çalıştır
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Komut çalıştırılamadı: ${error}`);
    await interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
  }
});

// 🛠 Hata engelleyici
process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// 🌐 Express (sessiz çalışır, sadece uptime içindir)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot çalışıyor.'));
app.listen(PORT);

// 🚀 Botu başlat
client.login(process.env.TOKEN);
