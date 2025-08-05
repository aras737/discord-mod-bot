require('dotenv').config();
const fs = require('fs');
const http = require('http');
const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');

// 🌐 Render ortam değişkenleri
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// ⚠️ Ortam değişkenlerini kontrol et
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik! Render Environment Variables bölümünü kontrol et.");
  process.exit(1);
}

// 🛰️ Render için sahte HTTP portu aç (uyandırma amaçlı)
http.createServer((req, res) => {
  res.end('Bot çalışıyor ✅');
}).listen(PORT, () => {
  console.log(`🌐 Render portu açık: ${PORT}`);
});

// 🤖 Discord Client başlat
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// 🧠 Komutları yükle
client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    } else {
      console.warn(`⚠️ Komut eksik: ${file} — 'data' veya 'execute' tanımlı değil.`);
    }
  } catch (err) {
    console.error(`❌ Komut yüklenemedi: ${file}`, err);
  }
}

// 📦 Slash Komutları Sunucuya Yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('♻️ Eski komutlar temizleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Yeni komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    for (const cmd of data) {
      console.log(`✅ /${cmd.name} komutu yüklendi.`);
    }
  } catch (error) {
    console.error('❌ Komut yükleme hatası:', error);
    process.exit(1);
  }
})();

// 🔔 Bot hazır olduğunda
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// 📥 Slash komutlar çalıştırma
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ /${interaction.commandName} komut hatası:`, error);
    try {
      await interaction.reply({ content: '❌ Komut çalıştırılırken hata oluştu.', ephemeral: true });
    } catch (err) {
      console.warn(`⚠️ Hata cevabı verilemedi: ${interaction.commandName}`);
    }
  }
});

// 🔴 Global hata yakalama (çökme engelleyici)
process.on('unhandledRejection', reason => {
  console.error('🛑 Unhandled Rejection:', reason);
});
process.on('uncaughtException', err => {
  console.error('🛑 Uncaught Exception:', err);
});

// 🔐 Discord Bot'a giriş
client.login(TOKEN);
