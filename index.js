// Gerekli modüller
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Express sunucusu (uptime için)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Aktif!'));
app.listen(PORT, () => {
  console.log(`🌐 Express portu dinleniyor: ${PORT}`);
});

// Discord client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Komut koleksiyonu
client.commands = new Collection();
const komutlar = [];
const komutKlasoru = './komutlar';

// Komutları oku
if (fs.existsSync(komutKlasoru)) {
  const dosyalar = fs.readdirSync(komutKlasoru).filter(file => file.endsWith('.js'));
  for (const file of dosyalar) {
    const command = require(`${komutKlasoru}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Eksik komut: ${file}`);
    }
  }
} else {
  console.warn('⚠️ Komut klasörü bulunamadı!');
}

// Bot hazır olduğunda
client.once('ready', async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: komutlar }
    );
    console.log('✅ Slash komutlar yüklendi.');
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
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

// Hataları yakala
process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🚨 Unhandled Rejection:', reason);
});

client.login(process.env.TOKEN).then(() => {
  console.log("🚀 Bot başlatıldı ve giriş yapıldı.");
}).catch(err => {
  console.error("❌ Giriş hatası:", err);
});

console.log("⚙️ Bot başlatılıyor, lütfen bekleyin...");
