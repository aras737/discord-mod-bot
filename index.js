const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');
require('dotenv').config(); // .env desteği (Render ortamında da çalışır)

// Render ortam değişkenleri
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// HTTP sunucusu (Render botun aktif kalması için)
http.createServer((req, res) => res.end('Bot aktif')).listen(PORT, () => {
  console.log(`🌐 Render sahte port ${PORT} dinleniyor...`);
});

// Zorunlu değişkenler kontrolü
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik. Render Environment Variables bölümünü kontrol et.");
  process.exit(1);
}

// Bot istemcisi tanımı
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commands = [];

// Komutları klasörden oku
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: /${command.data.name}`);
  } else {
    console.warn(`⚠️ ${file} komut dosyası "data" veya "execute" içermiyor.`);
  }
}

// Slash komutları REST API ile sunucuya yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Eski komutlar siliniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Yeni komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    console.log(`🎯 ${data.length} komut başarıyla yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Komut yüklenirken hata:', error);
  }
})();

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Komut çalıştırma
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ Komut hatası (${interaction.commandName}):`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ Komut çalıştırılırken hata oluştu.', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Komut çalıştırılırken hata oluştu.', ephemeral: true });
    }
  }
});

// Botu başlat
client.login(TOKEN);
