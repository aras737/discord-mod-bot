const { QuickDB } = require("quick.db");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes
} = require("discord.js");

const noblox = require("noblox.js");

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.db = new QuickDB();
client.commands = new Collection();
const commands = [];

/* ================= AYARLAR ================= */

// ❗ SADECE BU KULLANICILAR
const ALLOWED_USERS = [
  "1389930042200559706",
  "1385277307106885722"
];

// ❗ TEST SUNUCU ID (ÇOK ÖNEMLİ)
const GUILD_ID = process.env.GUILD_ID;

/* ================= KOMUTLAR ================= */

const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.data.name}`);
    }
  }
}

/* ================= EVENTS ================= */

const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (!event?.name) continue;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    console.log(`📌 Event yüklendi: ${event.name}`);
  }
}

/* ================= READY ================= */

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    // 🔥 GUILD SLASH (ANINDA GÖZÜKÜR)
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );
    console.log("🚀 Slash komutlar sunucuya yüklendi");
  } catch (err) {
    console.error("❌ Slash yükleme hatası:", err);
  }

  // Roblox girişi (OPSİYONEL)
  if (process.env.ROBLOX_COOKIE) {
    try {
      const user = await noblox.setCookie(process.env.ROBLOX_COOKIE);
      console.log(`🟢 Roblox giriş başarılı: ${user.UserName}`);
    } catch (err) {
      console.log("⚠️ Roblox cookie geçersiz, atlandı");
    }
  } else {
    console.log("⚠️ Roblox cookie yok, atlandı");
  }
});

/* ================= INTERACTION ================= */

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // 🔒 Yetki kontrolü
  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    return interaction.reply({
      content: "❌ Bu komutu kullanamazsın.",
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, client);
    console.log(`✅ Komut: /${interaction.commandName} | ${interaction.user.tag}`);
  } catch (err) {
    console.error("Komut hatası:", err);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Komut hatası.", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Komut hatası.", ephemeral: true });
    }
  }
});

/* ================= HATALAR ================= */

process.on("unhandledRejection", err => console.error("Promise:", err));
process.on("uncaughtException", err => {
  console.error("Exception:", err);
  process.exit(1);
});

client.login(process.env.TOKEN);
