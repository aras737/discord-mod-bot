// Gerekli modüller
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');

// Ortam değişkenlerini yükle
dotenv.config();

// Discord Client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Komut koleksiyonu
client.commands = new Collection();
const commands = [];

// commands klasöründen komutları yükle
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')).forEach(file => {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
});

// Bot hazır olduğunda
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yüklenirken hata:', err);
  }
});

// Slash komutlar çalıştırıldığında
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Komut çalıştırılırken hata oluştu.', ephemeral: true });
  }
});

// Bot giriş
client.login(process.env.TOKEN);

// Render'da botu 7/24 açık tutmak için sahte Express sunucusu
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot çalışıyor!'));
app.listen(PORT, () => console.log(`🌐 Web sunucusu port ${PORT} üzerinde çalışıyor.`));
