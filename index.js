const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

// ─────────────────────────────
// SAHTE PORT (Render/Replit için)
// ─────────────────────────────
const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('✅ Phantom Discord Bot aktif!\n');
  })
  .listen(PORT, () => {
    console.log(`🌐 Sahte port açıldı: http://localhost:${PORT}`);
  });

// ─────────────────────────────
// BOT BAŞLATILIYOR
// ─────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Komutları tara
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[⚠️ UYARI] ${file} içinde 'data' veya 'execute' eksik!`);
  }
}

// Slash komutları yükle
const rest = new REST().setToken(token);

(async () => {
  try {
    console.log('🧹 Önceki komutlar siliniyor...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });

    console.log('🚀 Yeni komutlar yükleniyor...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log(`✅ Toplam ${commands.length} komut yüklendi:`);
    commands.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Slash komutlarını yüklerken hata:', error);
  }
})();

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Slash komut etkileşimi
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('💥 Komut hatası:', error);
    await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
  }
});

client.login(token);
