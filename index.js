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

// ================= KOMUT HANDLER =================
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`📡 Komut yüklendi: ${command.data.name}`);
      }
    }
}

// ================= EVENT HANDLER =================
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
    for (const file of eventFiles) {
      const event = require(path.join(eventsPath, file));
      if (event.name) {
        if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
        else client.on(event.name, (...args) => event.execute(...args, client));
      }
    }
}

// ================= READY =================
client.once(Events.ClientReady, async () => {
  console.log(`✅ ${client.user.tag} Aktif!`);
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("🚀 Slash komutları güncellendi.");
  } catch (err) {
    console.error("Rest hatası:", err);
  }

  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`🤖 Roblox: ${currentUser.UserName}`);
  } catch (err) {
    console.log("Roblox Hatası: Cookie geçersiz veya girilmemiş.");
  }
});

// ================= INTERACTION (ERENSI YETKİLEME SİSTEMİ) =================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Sadece sunucu içi kullanım
  if (!interaction.inGuild()) {
    return interaction.reply({ content: "❌ Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
  }

  const member = interaction.member;

  // --- 🛡️ OTOMATİK ROL VE YETKİ TARAYICI ---

  // 1. Kullanıcı Yetki Taraması (Owner olsan bile yetkin yoksa giremezsin)
  if (command.userPermissions && command.userPermissions.length > 0) {
    const missingPerms = command.userPermissions.filter(perm => !member.permissions.has(perm));
    
    if (missingPerms.length > 0) {
      return interaction.reply({
        content: `❌ Bu komut için gerekli yetkiye sahip bir rolün bulunmuyor!\nEksik Yetki(ler): \`${missingPerms.join(", ")}\``,
        ephemeral: true
      });
    }
  }

  // 2. Bot Yetki Taraması (Botun o role gücü yetiyor mu?)
  if (command.botPermissions && command.botPermissions.length > 0) {
    const missingBotPerms = command.botPermissions.filter(perm => !interaction.guild.members.me.permissions.has(perm));

    if (missingBotPerms.length > 0) {
      return interaction.reply({
        content: `❌ Benim bu komutu çalıştırmak için yetkim yetersiz: \`${missingBotPerms.join(", ")}\``,
        ephemeral: true
      });
    }
  }

  // --- EXECUTE ---
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Komut çalışırken teknik bir hata oluştu.", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Komut çalışırken teknik bir hata oluştu.", ephemeral: true });
    }
  }
});

// ================= EXPRESS & ERROR =================
app.get("/", (req, res) => res.send("Bot 7/24 Aktif"));
app.listen(process.env.PORT || 3000);

process.on('unhandledRejection', error => console.error('Hata:', error));
process.on('uncaughtException', error => console.error('Kritik Hata:', error));

client.login(process.env.TOKEN);
