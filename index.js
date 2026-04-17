require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { QuickDB } = require("quick.db");

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

// ================= WEB =================
const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "tfa_secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

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

// ================= DISCORD =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
client.db = new QuickDB();
const commands = [];

// 🔒 Yetkiler
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
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log("📡 Komut yüklendi:", command.data.name);
      } else {
        console.log("❌ Hatalı komut:", file);
      }
    } catch (err) {
      console.log("❌ Komut hata:", file, err.message);
    }
  }
}

// ================= EVENT YÜKLE =================
const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

  for (const file of eventFiles) {
    try {
      const event = require(path.join(eventsPath, file));
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log("📡 Event:", event.name);
    } catch (err) {
      console.log("❌ Event hata:", file);
    }
  }
}

// ================= READY =================
client.once(Events.ClientReady, async () => {
  console.log(`✅ ${client.user.tag} Aktif!`);

  // 🟢 YEŞİL STATUS
  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: "TFA | Moderasyon",
        type: 0
      }
    ]
  });

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands
    });
    console.log("🚀 Slash komutları yüklendi.");
  } catch (err) {
    console.error("Komut yükleme hatası:", err.message);
  }

  // Roblox fix
  try {
    if (process.env.ROBLOX_COOKIE) {
      const user = await noblox.setCookie(process.env.ROBLOX_COOKIE);
      console.log("Roblox giriş:", user.UserName);
    } else {
      console.log("⚠️ Roblox cookie yok.");
    }
  } catch (err) {
    console.log("⚠️ Roblox hata:", err.message);
  }
});

// ================= KOMUT ÇALIŞTIR =================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const member = interaction.member;

  // 🔥 FIX (CRASH ENGEL)
  if (!member || !member.permissions) {
    return interaction.reply({
      content: "❌ Yetki kontrol hatası",
      ephemeral: true
    });
  }

  const hasUser = ALLOWED_USERS.includes(interaction.user.id);
  const hasRole = member.roles?.cache?.some(r => ALLOWED_ROLES.includes(r.id));

  // 🔥 ADMIN yetkisi de ekledik
  const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

  if (!hasUser && !hasRole && !isAdmin) {
    return interaction.reply({
      content: "❌ Bu komutu kullanamazsın",
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      interaction.followUp({ content: "❌ Hata oluştu", ephemeral: true });
    } else {
      interaction.reply({ content: "❌ Hata oluştu", ephemeral: true });
    }
  }
});

// ================= WEB =================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
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
    avatar: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
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
  console.log("🌐 Panel aktif:", PORT);
});

// ================= HATA =================
process.on("unhandledRejection", err => console.error("Promise:", err));
process.on("uncaughtException", err => {
  console.error("Crash:", err);
  process.exit(1);
});

// ================= START =================
client.login(process.env.TOKEN);
