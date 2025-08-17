// ========== ÇEKİRDEK ==========
const { Client, GatewayIntentBits, Collection, REST, Routes, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
dotenv.config();

const config = require('./config.json');

// ========== CLIENT ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
const komutlarJSON = [];

// ========== KOMUT YÜKLEYİCİ ==========
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    komutlarJSON.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: ${command.data.name}`);
  } else {
    console.log(`⚠️ Hatalı komut: ${file}`);
  }
}

// ========== EVENT YÜKLEYİCİ ==========
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client, komutlarJSON));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client, komutlarJSON));
  }
  console.log(`📡 Event yüklendi: ${file}`);
}

// ========== EXPRESS KEEP ALIVE ==========
const app = express();
app.get('/', (req, res) => res.send('✅ Bot aktif'));
app.listen(process.env.PORT || 8080, () => {
  console.log(`🌐 Express çalışıyor: ${process.env.PORT || 8080}`);
});

// ========== HATA YAKALAMA ==========
process.on('uncaughtException', e => console.error('🚨 Hata:', e));
process.on('unhandledRejection', e => console.error('🚨 Promise Hatası:', e));

if (!process.env.TOKEN) {
  console.error('❌ .env içine TOKEN koy!');
  process.exit(1);
}

client.login(process.env.TOKEN);
