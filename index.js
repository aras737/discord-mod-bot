require('dotenv').config();
const fs = require('fs');
const http = require('http');
const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');

// Render ortam değişkenlerini al
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Ortam değişkenlerini kontrol et
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik! Render Environment Variables bölümünü kontrol et.");
  process.exit(1);
}

// Render için sahte port aç
http.createServer((req, res) => {
  res.end('Bot çalışıyor ✅');
}).listen(PORT, () => {
  console.log(`🌐 Render portu açık: ${PORT}`);
});

// Botu başlat
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Komutları yükle
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
      console.warn(`⚠️ Komut eksik: ${file} — 'data' veya 'execute' yok.`);
    }
  } catch (err) {
    console.error(`❌ Komut yüklenemedi: ${file}`, err);
  }
}

// Komutları zorla yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('♻️ Komutlar sıfırlanıyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Komutlar yeniden yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    data.forEach(cmd => console.log(`✅ /${cmd.name} başarıyla yüklendi.`));
  } catch (error) {
    console.error('❌ Komutları yüklerken hata oluştu:', error);
    process.exit(1);
  }
})();

// Bot hazır olunca
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Slash komutlar çalıştırma
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ Hata: /${interaction.commandName}`, error);
    try {
      await interaction.reply({ content: '❌ Bu komut çalıştırılamadı.', ephemeral: true });
    } catch (_) {
      console.warn(`⚠️ interaction.reply hatası: ${interaction.commandName}`);
    }
  }
});

// Giriş yap
client.login(TOKEN);
