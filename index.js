const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ortam değişkenleri (Render üzerinden alınır)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Client başlat
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();
const commands = [];

// Komutları yükle
const commandPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}
console.log(`✅ ${commands.length} komut yüklendi: ${commandFiles.join(', ')}`);

// Eventleri yükle
const eventPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventPath).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}
console.log(`📂 ${eventFiles.length} event yüklendi: ${eventFiles.join(', ')}`);

// Slash komutları yükle
client.once('ready', async () => {
  console.log(`🟢 Bot aktif: ${client.user.tag}`);

  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    console.log(`✅ Slash komutları sunucuya yüklendi (${GUILD_ID})`);
    console.log(`🌐 Sahte port: 3000 (Render için gösterim)`);

    // Sahte portu dinleyen küçük bir express sunucusu gibi davran
    setInterval(() => {
      console.log(`📡 [PORT 3000] Durum: OK - ${new Date().toLocaleTimeString()}`);
    }, 60 * 1000); // her dakika logla (isteğe bağlı)
  } catch (err) {
    console.error('❌ Slash komutları yüklenemedi:', err);
  }
});

// Botu başlat
client.login(TOKEN);
