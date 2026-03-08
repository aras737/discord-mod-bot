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
  Routes,
  EmbedBuilder
} = require("discord.js");
const noblox = require("noblox.js");

// Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans // Yasaklar listesi için şart
  ],
  partials: [Partials.Channel],
});

client.db = new QuickDB();
client.commands = new Collection();
const commands = [];

// 🔒 AYARLAR
const ALLOWED_USERS = ["752639955049644034", "1389930042200559706"];
const ALLOWED_ROLES = ["1465758739645731022", "1465761516405133559", "1465762912219037926"];
const GUILD_ID = "BURAYA_SUNUCU_ID_YAZ"; // Komutların anında düşmesi için sunucu ID'si

// Komutları yükle
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

// Olayları yükle
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

// Bot hazır olduğunda
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("🔄 Komutlar senkronize ediliyor...");
    // applicationGuildCommands kullanarak komutları sadece senin sunucuna anında yükler
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
    console.log("🚀 Slash komutları başarıyla sunucuya işlendi.");
  } catch (err) { console.error("Komut yükleme hatası:", err); }

  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`🟦 Roblox aktif: ${currentUser.UserName}`);
  } catch (err) { console.error("🟥 Roblox girişi başarısız."); }
});

// Slash komut işlemleri
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // 🚫 Yetki kontrolü
  const hasUserPermission = ALLOWED_USERS.includes(interaction.user.id);
  const hasRolePermission = interaction.member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

  if (!hasUserPermission && !hasRolePermission) {
    return interaction.reply({ content: "❌ Bu botun komutlarını sadece yetkili kişiler kullanabilir.", ephemeral: true });
  }

  try {
    // Tüm komutlar için deferReply: "Uygulama yanıt vermedi" hatasını kökten çözer
    // Eğer komut kendi içinde reply yapıyorsa bu kısmı command.execute içine de taşıyabilirsin
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`💥 Hata: ${interaction.commandName}`, err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Komut çalıştırılırken bir hata oluştu.", ephemeral: true });
    }
  }
});

process.on('unhandledRejection', error => console.error('Hata:', error));
client.login(process.env.TOKEN);
