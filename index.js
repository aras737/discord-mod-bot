const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Render için sahte port açma
http.createServer((req, res) => res.end('Bot aktif!')).listen(PORT);

// Bot oluştur
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

// Komutları yükle
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// Slash komutları sıfırla ve yeniden yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('⏳ Eski komutlar siliniyor ve yeni komutlar yükleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ ${data.length} komut başarıyla yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Komut yükleme hatası:', error);
  }
})();

// Ready eventi
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// interactionCreate eventini başka dosyaya taşıdığını varsayıyorum, onu buraya import etmen lazım.
// Örnek:
// const handleInteraction = require('./interactionCreate');
// client.on('interactionCreate', handleInteraction);

client.login(TOKEN);
