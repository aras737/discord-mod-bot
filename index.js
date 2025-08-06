const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Express (uptime için)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Aktif!'));
app.listen(PORT, () => {
  console.log(`🌐 Express portu dinleniyor: ${PORT}`);
});

// Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();
const komutlar = [];
const komutKlasoru = './commands';

console.log('⚙️ Komutlar yükleniyor...');

try {
  const komutDosyalari = fs.readdirSync(komutKlasoru).filter(f => f.endsWith('.js'));

  for (const file of komutDosyalari) {
    const command = require(`${komutKlasoru}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Hatalı komut: ${file}`);
    }
  }
} catch (err) {
  console.error('❌ Komutlar yüklenemedi:', err);
}

// Bot hazır olunca
client.once('ready', async () => {
  console.log(`✅ Bot Aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: komutlar }
    );
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }
});

// Slash komut tetikleyici
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ Komut hatası: ${err}`);
    await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
  }
});

// Hata yakalayıcılar
process.on('uncaughtException', err => console.error('🚨 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('🚨 Unhandled Rejection:', err));

// Giriş
client.login(process.env.TOKEN);
