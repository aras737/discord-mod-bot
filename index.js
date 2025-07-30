const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 🌐 Render gibi platformlar için sahte HTTP port
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot çalışıyor!')).listen(PORT, () => {
  console.log(`🌐 Sahte port aktif: ${PORT}`);
});

// Render panelinden alınan değişkenler
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Ortam değişkenleri eksik. TOKEN, CLIENT_ID, GUILD_ID gerekli.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);

    if (!command.data || !command.execute) {
      console.warn(`⚠️ Hatalı komut atlandı: ${file} (data veya execute eksik)`);
      continue;
    }

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: /${command.data.name}`);
  } catch (err) {
    console.error(`❌ ${file} yüklenemedi:`, err);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('\n🔁 Komutlar GUILD seviyesinde yeniden yükleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ ${commands.length} komut başarıyla yüklendi.`);
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
    process.exit(1);
  }
})();

client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ /${interaction.commandName} komutunda hata:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
