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
  PermissionFlagsBits // Yetkiler için eklendi
} = require("discord.js");
const noblox = require("noblox.js");

// Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans // Ban sistemi için şart
  ],
  partials: [Partials.Channel],
});

client.db = new QuickDB();
client.commands = new Collection();
const commands = [];

// 🔒 Sadece bu iki kullanıcı komut kullanabilir
const ALLOWED_USERS = [
  "1389930042200559706", 
  "1385277307106885722" 
];

// --- KOMUTLARI YÜKLE ---
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`📡 Komut belleğe alındı: ${command.data.name}`);
    }
  }
}

// --- OLAYLARI YÜKLE ---
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

// --- BOT HAZIR OLDUĞUNDA ---
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("🔄 Eski komutlar temizleniyor ve yenileri yükleniyor...");
    
    // Global komutları tamamen temizleyip yeniden yükler (Net çözüm)
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    
    console.log("🚀 Tüm Slash komutları başarıyla güncellendi.");
  } catch (err) {
    console.error("❌ Komut yükleme hatası:", err);
  }

  // Roblox girişi
  if (process.env.ROBLOX_COOKIE) {
    try {
      const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
      console.log(`🟦 Roblox: ${currentUser.UserName} olarak giriş yapıldı.`);
    } catch (err) {
      console.error("🟥 Roblox hatası:", err.message);
    }
  }
});

// --- INTERACTION HANDLING ---
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // 🚫 YETKİ KONTROLÜ
  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    return interaction.reply({
      content: "❌ Bu botun komutlarını kullanmaya yetkin yok kanka.",
      ephemeral: true
    });
  }
 
  try {
    // Ban komutu veya ban-listesi gibi işlemlerde 'Uygulama yanıt vermedi' hatasını önlemek için
    // Eğer komutun içinde deferReply yoksa buradan da yönetebilirsin ama 
    // en iyisi komut dosyalarının içinde interaction.deferReply() kullanmaktır.
    
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`💥 Hata (${interaction.commandName}):`, err);
    const errorMsg = "Komut çalıştırılırken teknik bir sorun çıktı.";
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => null);
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => null);
    }
  }
});

// Hata yakalama (Botun kapanmaması için)
process.on('unhandledRejection', error => console.error('Görünmeyen Hata:', error));
process.on('uncaughtException', error => console.error('Kritik Hata:', error));

client.login(process.env.TOKEN);
