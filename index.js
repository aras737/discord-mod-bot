require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Render ortam değişkenlerinden al
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik! Render'da Environment Variables kısmını kontrol et.");
  process.exit(1);
}

// Sahte port (Render için)
http.createServer((req, res) => res.end('Bot çalışıyor')).listen(PORT, () => {
  console.log(`🌐 Render Port dinleniyor: ${PORT}`);
});

// Botu başlat
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ ${file} içinde 'data' veya 'execute' eksik.`);
  }
}

// Komutları zorla yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔁 Komutlar sıfırlanıyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    data.forEach(cmd => console.log(`✅ /${cmd.name} yüklendi`));
  } catch (error) {
    console.error('❌ Komut yükleme hatası:', error);
    process.exit(1);
  }
})();

// Bot hazır
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Slash komutları çalıştır
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ ${interaction.commandName} çalıştırma hatası:`, error);
    await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
  }
});

client.login(TOKEN);
