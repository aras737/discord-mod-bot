const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 🌐 Render ortam değişkenlerinden alınıyor
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Bot Render'da çalışıyor gibi görünmesi için sahte HTTP port
http.createServer((req, res) => res.end('Bot çalışıyor')).listen(PORT, () => {
  console.log(`🌐 Render sahte port açık: ${PORT}`);
});

// Gerekli bilgiler eksikse çık
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ TOKEN, CLIENT_ID veya GUILD_ID tanımlı değil.');
  process.exit(1);
}

// Client oluştur
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Komutları yükle
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: /${command.data.name}`);
  } else {
    console.warn(`⚠️ ${file} içinde "data" veya "execute" eksik, atlandı.`);
  }
}

// Komutları yükle (GUILD bazlı)
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🚀 Komutlar yükleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ ${commands.length} komut başarıyla yüklendi.`);
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
  }
})();

// Bot hazır
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Komutları çalıştır
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ /${interaction.commandName} komutunda hata:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ Hata oluştu.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ Hata oluştu.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
