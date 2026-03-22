const { QuickDB } = require("quick.db");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

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

// ================= WEB =================
const app = express();
app.use(express.urlencoded({ extended: true }));

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
  secret: "tfa_secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// ================= DISCORD BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.db = new QuickDB();
client.commands = new Collection();
const commands = [];

// 🔒 Kullanıcı / Rol yetki
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
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`Komut yüklendi: ${command.data.name}`);
  } else {
    console.log(`Komut eksik veya hatalı: ${file}`);
  }
}

// ================= EVENT YÜKLE =================
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.name) {
    if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
    else client.on(event.name, (...args) => event.execute(...args, client));
    console.log(`Olay yüklendi: ${event.name}`);
  } else {
    console.log(`Olay eksik veya hatalı: ${file}`);
  }
}

// ================= READY =================
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Slash komutları yüklendi.");
  } catch (err) {
    console.error("Komut hatası:", err);
  }

  // Roblox
  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`Roblox giriş: ${currentUser.UserName}`);
  } catch (err) {
    console.error("Roblox hata:", err.message);
  }
});

// ================= SLASH =================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const hasUserPermission = ALLOWED_USERS.includes(interaction.user.id);
  const hasRolePermission = interaction.member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

  if (!hasUserPermission && !hasRolePermission) {
    return interaction.reply({
      content: "❌ Yetki yok",
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    interaction.reply({ content: "❌ Hata oluştu", ephemeral: true });
  }
});

// ================= WEB ROUTES =================

// ANA SAYFA
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// LOGIN
app.get("/login", passport.authenticate("discord"));

app.get("/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => res.redirect("/")
);

app.get("/logout", (req, res) => {
  req.logout(()=>{});
  res.redirect("/");
});

// API USER
app.get("/api/user", (req, res) => {
  if(!req.user) return res.json({ login:false });

  res.json({
    login:true,
    username:req.user.username,
    avatar:`https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`,
    guilds:req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20)
  });
});

// LOG AYAR
app.post("/api/log", (req, res) => {
  if(!req.user) return res.json({ ok:false });

  client.db.set(`log_${req.body.guild}`, req.body.channel);

  res.json({ ok:true });
});

// ================= PORT =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Panel aktif:", PORT);
});

// ================= HATALAR =================
process.on('unhandledRejection', error => console.error('Promise:', error));
process.on('uncaughtException', error => {
  console.error('Exception:', error);
  process.exit(1);
});

client.login(process.env.TOKEN);
