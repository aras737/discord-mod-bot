const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Render ortam değişkenleri
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
for (const file of fs.readdirSync(commandPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
    commands.push(cmd.data.toJSON());
  }
}

// Eventleri yükle
const eventPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventPath).filter(f => f.endsWith('.js'))) {
  const evt = require(`./events/${file}`);
  if (evt.once) client.once(evt.name, (...args) => evt.execute(...args, client));
  else client.on(evt.name, (...args) => evt.execute(...args, client));
}

// Slash komutları yükle
client.once('ready', async () => {
  console.log(`✅ Bot hazır: ${client.user.tag}`);

  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Slash komutları yüklendi');
  } catch (err) {
    console.error('❌ Slash yükleme hatası:', err);
  }
});

// Botu başlat
client.login(TOKEN);
