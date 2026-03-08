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

// Discord Client
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

// 🔒 Sadece bu iki kullanıcı komut kullanabilir
const ALLOWED_USERS = [
  "752639955049644034",
  "1389930042200559706"
];

// 🔒 Yetkili Rol ID'leri (BURAYA ROL ID KOY)
const ALLOWED_ROLES = [
  "1465758739645731022",
  "1465761516405133559",
  "1465762912219037926"
];

// Komutları yükle
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

// Olayları yükle
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.name) {
    if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
    else client.on(event.name, (...args) => event.execute(...args, client));
    console.log(`Olay yüklendi: ${event.name}${event.once ? " (Bir Kez)" : ""}`);
  } else {
    console.log(`Olay eksik veya hatalı: ${file}`);
  }
}

// Bot hazır olduğunda
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Slash komutları başarıyla yüklendi.");
  } catch (err) {
    console.error("Komut yükleme hatası:", err);
  }

  // Roblox girişi
  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`Roblox giriş başarılı: ${currentUser.UserName} (ID: ${currentUser.UserID})`);
  } catch (err) {
    console.error("Roblox giriş başarısız:", err.message);
  }
});

// Slash komut işlemleri
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // 🚫 Kullanıcı veya rol yetki kontrolü
  const hasUserPermission = ALLOWED_USERS.includes(interaction.user.id);
  const hasRolePermission = interaction.member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

  if (!hasUserPermission && !hasRolePermission) {
    console.log(`Yetkisiz kullanıcı komut denedi: ${interaction.user.tag}`);
    return interaction.reply({
      content: "❌ Bu botun komutlarını sadece yetkili kişiler kullanabilir.",
      ephemeral: true
    });
  }

  try {
    console.log(`✅ Komut kullanıldı: ${interaction.user.tag} /${interaction.commandName}`);
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`Komut hatası (${interaction.commandName}):`, err);
    const msg = "Komut çalıştırılırken bir hata oluştu.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: msg, ephemeral: true });
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

// Hata yakalama
process.on('unhandledRejection', error => console.error('Promise hatası:', error));
process.on('uncaughtException', error => {
  console.error('Exception:', error);
  process.exit(1);
});

client.login(process.env.TOKEN);
