const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Render ortam değişkenleri (TOKEN, CLIENT_ID, GUILD_ID, PORT gibi)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Render için sahte bir port açalım
http.createServer((req, res) => res.end('Bot aktif')).listen(PORT, () =>
  console.log(`🌐 Sahte port açık: ${PORT}`)
);

// Discord istemcisi tanımı
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Komutları yükle
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
  : [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: /${command.data.name}`);
  } else {
    console.warn(`⚠️ Uyarı: ${file} komutu geçersiz (data veya execute eksik).`);
  }
}

// Slash komutları zorla yükle (GUILD bazlı)
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔁 Komutlar Discord\'a yükleniyor...');
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`📥 Toplam ${data.length} komut yüklendi.`);
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
  }
})();

// Bot hazır
client.once('ready', () => {
  console.log(`🤖 Bot hazır: ${client.user.tag}`);
});

// Slash komutlara cevap ver
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
