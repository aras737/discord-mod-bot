const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// Token, Guild ID, Client ID: Render ortam değişkenlerinden alınır
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;

console.log("🚀 Bot başlatılıyor...");

// Komutları yükle
const commandFolders = fs.readdirSync("./commands");
let totalCommands = 0;
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      totalCommands++;
    }
  }
}

// Eventleri yükle
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
let totalEvents = 0;
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.name && typeof event.execute === "function") {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    totalEvents++;
  }
}

// Komut kayıt/log
client.once("ready", () => {
  console.log(`✅ ${client.user.tag} olarak giriş yapıldı.`);
  console.log(`📦 ${totalCommands} komut yüklendi.`);
  console.log(`🎯 ${totalEvents} event yüklendi.`);
  console.log(`📡 Render sahte port: http://localhost:3000`);
});

// Sahte port: Render'ın crash olmaması için basit express sunucusu (zorunlu değil ama iyi olur)
require("http")
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Phantom bot çalışıyor.\n");
  })
  .listen(3000);

// Botu başlat
client.login(TOKEN).catch(err => {
  console.error("❌ Giriş başarısız. TOKEN doğru mu?", err.message);
});
