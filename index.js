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
  Routes,
  PermissionsBitField
} = require("discord.js");

const noblox = require("noblox.js");

// ================= WEB PANEL =================
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

// ================= KOMUT YÜKLEME (HANDLER) =================
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`📡 Komut yüklendi: ${command.data.name}`);
  }
}

// ================= EVENT YÜKLEME =================
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.name) {
    if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
    else client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ================= BOT READY =================
client.once(Events.ClientReady, async () => {
  console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("🚀 Slash komutları başarıyla senkronize edildi.");
  } catch (err) {
    console.error("Komut yükleme hatası:", err);
  }

  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`🤖 Roblox API aktif: ${currentUser.UserName}`);
  } catch (err) {
    console.error("Roblox Hatası:", err.message);
  }
});

// ================= INTERACTION (YETKİ KONTROLÜ) =================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // DM kontrolü
  if (!interaction.inGuild()) {
    return interaction.reply({ content: "❌ Komutlar sadece sunucularda çalışır.", ephemeral: true });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const member = interaction.member;

  // --- 🛡️ ERENSI YETKİ TARAMA SİSTEMİ ---
  
  // 1. Kullanıcı Yetki Taraması (Rollerin içindeki yetkilere bakar)
  if (command.userPermissions && command.userPermissions.length > 0) {
    const missingUserPerms = command.userPermissions.filter(perm => !member.permissions.has(perm));
    
    if (missingUserPerms.length > 0) {
      return interaction.reply({
        content: `❌ Bu komutu kullanmak için şu yetkilere sahip bir rolün olmalı: \`${missingUserPerms.join(", ")}\``,
        ephemeral: true
      });
    }
  }

  // 2. Bot Yetki Taraması (Botun o işlemi yapmaya yetkisi var mı?)
  if (command.botPermissions && command.botPermissions.length > 0) {
    const missingBotPerms = command.botPermissions.filter(perm => !interaction.guild.members.me.permissions.has(perm));

    if (missingBotPerms.length > 0) {
      return interaction.reply({
        content: `❌ Benim bu işlemi yapabilmem için şu yetkilere ihtiyacım var: \`${missingBotPerms.join(", ")}\``,
        ephemeral: true
      });
    }
  }

  // 3. Sadece Geliştirici Kontrolü (Opsiyonel)
  if (command.developerOnly && interaction.user.id !== "SENIN_ID_BURAYA") {
    return interaction.reply({ content: "❌ Bu komut sadece bot sahibine özeldir.", ephemeral: true });
  }

  // --- KOMUTU ÇALIŞTIR ---
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const errorMsg = { content: "❌ Komut çalışırken bir hata oluştu!", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(errorMsg);
    else await interaction.reply(errorMsg);
  }
});

// ================= WEB API & PORT =================
app.get("/", (req, res) => res.send("Bot Aktif!"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Web sunucusu hazır."));

// ================= HATA YÖNETİMİ =================
process.on('unhandledRejection', error => console.error('Hata (Promise):', error));
process.on('uncaughtException', error => {
  console.error('Kritik Hata (Exception):', error);
  // Botu hemen kapatma, hatayı logla
});

client.login(process.env.TOKEN);
