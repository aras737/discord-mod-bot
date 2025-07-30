const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const express = require('express');
const app = express();

// === Config değişkenleri ===
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error("❌ Render ortam değişkenleri eksik: TOKEN / CLIENT_ID / GUILD_ID");
  process.exit(1);
}

// === Discord Client ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Komut ve event koleksiyonları
client.commands = new Collection();
client.events = new Collection();

// === Komutları yükle ===
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./src/commands/${file}`);
  client.commands.set(command.name, command);
}
console.log(`✅ ${commandFiles.length} komut yüklendi.`);

// === Eventleri yükle ===
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./src/events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}
console.log(`📡 ${eventFiles.length} event yüklendi.`);

// === Giriş yap ===
client.login(token)
  .then(() => console.log(`🤖 Bot aktif: ${client.user.tag}`))
  .catch(err => {
    console.error('❌ Bot giriş hatası:', err);
    process.exit(1);
  });

// === Express sunucusu (Render için ping koruması) ===
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('✅ Bot çalışıyor.'));
app.listen(PORT, () => {
  console.log(`🌐 Gerçek port dinleniyor: http://localhost:${PORT}`);
});
