// ================= CORE =================
const { QuickDB } = require("quick.db");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ================= WEB =================
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const MemoryStore = require("memorystore")(session);

const app = express();
app.use(express.urlencoded({ extended: true }));

// ================= DISCORD =================
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  PermissionsBitField
} = require("discord.js");

const noblox = require("noblox.js");

// ================= LOG FORMAT =================
const log = (...args) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}]`, ...args);
};

// ================= PASSPORT =================
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ["identify", "guilds"]
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "tfa_secret",
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000
  })
}));

app.use(passport.initialize());
app.use(passport.session());

// ================= BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.db = new QuickDB();
client.commands = new Collection();
const commands = [];

// ================= YETKİ =================
const ALLOWED_USERS = [
  "752639955049644034",
  "1389930042200559706"
];

const ALLOWED_ROLES = [
  "ROL_ID_1",
  "ROL_ID_2"
];

// ================= KOMUT YÜKLE =================
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if ("data" in cmd && "execute" in cmd) {
        client.commands.set(cmd.data.name, cmd);
        commands.push(cmd.data.toJSON());
        log("📡 Komut yüklendi:", cmd.data.name);
      } else {
        log("⚠️ Eksik komut:", file);
      }
    } catch (err) {
      log("❌ Komut hatası:", file, err.message);
    }
  }
}

// ================= EVENT YÜKLE =================
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const event = require(path.join(eventsPath, file));
    if (event.name) {
      if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
      else client.on(event.name, (...args) => event.execute(...args, client));
      log("📡 Event:", event.name);
    }
  }
}

// ================= READY =================
client.once(Events.ClientReady, async () => {
  log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    log("🚀 Slash komutları güncellendi.");
  } catch (err) {
    log("❌ Slash yükleme hatası:", err.message);
  }

  // Roblox (opsiyonel)
  if (process.env.ROBLOX_COOKIE) {
    try {
      const user = await noblox.setCookie(process.env.ROBLOX_COOKIE);
      log(`🎮 Roblox giriş: ${user.UserName}`);
    } catch {
      log("⚠️ Roblox cookie geçersiz.");
    }
  } else {
    log("⚠️ Roblox cookie yok (normal)");
  }
});

// ================= SLASH =================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.inGuild()) {
    return interaction.reply({
      content: "❌ Sunucuda kullan.",
      ephemeral: true
    });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  let member;
  try {
    member = await interaction.guild.members.fetch(interaction.user.id);
  } catch {
    return interaction.reply({ content: "❌ Kullanıcı alınamadı", ephemeral: true });
  }

  const hasUser = ALLOWED_USERS.includes(interaction.user.id);

  const hasRole = member.roles.cache.some(r =>
    ALLOWED_ROLES.includes(r.id)
  );

  const hasPerm =
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ManageGuild);

  if (!hasUser && !hasRole && !hasPerm) {
    return interaction.reply({
      content: "❌ Yetki yok",
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, client);
  } catch (err) {
    log("❌ Komut hata:", err.message);
    if (interaction.replied || interaction.deferred) {
      interaction.followUp({ content: "❌ Hata oluştu", ephemeral: true });
    } else {
      interaction.reply({ content: "❌ Hata oluştu", ephemeral: true });
    }
  }
});

// ================= WEB ROUTES =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", passport.authenticate("discord"));

app.get("/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => res.redirect("/")
);

app.get("/logout", (req, res) => {
  req.logout(() => {});
  res.redirect("/");
});

app.get("/api/user", (req, res) => {
  if (!req.user) return res.json({ login: false });

  res.json({
    login: true,
    username: req.user.username,
    avatar: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`,
    guilds: req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20)
  });
});

app.post("/api/log", (req, res) => {
  if (!req.user) return res.json({ ok: false });

  client.db.set(`log_${req.body.guild}`, req.body.channel);
  res.json({ ok: true });
});

// ================= PORT =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log("🌐 Panel aktif:", PORT);
});

// ================= HATALAR =================
process.on("unhandledRejection", e => log("Promise:", e));
process.on("uncaughtException", e => {
  log("Fatal:", e);
  process.exit(1);
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
