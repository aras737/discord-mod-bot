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
  PermissionFlagsBits
} = require("discord.js");
// const db = require("quick.db"); // Kaldırıldı: Eski senkron quick.db kullanımı engellendi
const noblox = require("noblox.js");

// Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ✅ Düzeltme yapıldı: client tanımlandıktan sonra db atanıyor
client.db = new QuickDB();

client.commands = new Collection();
const commands = [];

// Komut yetki seviyeleri
const PERMISSION_LEVELS = {
  EVERYONE: 0,
  MODERATOR: 1,
  ADMINISTRATOR: 2,
  OWNER: 3
};

// Yetki kontrolü fonksiyonu
function checkPermissionLevel(member) {
  if (member.guild.ownerId === member.id) return PERMISSION_LEVELS.OWNER;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return PERMISSION_LEVELS.ADMINISTRATOR;

  const moderatorPermissions = [
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ModerateMembers
  ];

  if (moderatorPermissions.some(perm => member.permissions.has(perm))) {
    return PERMISSION_LEVELS.MODERATOR;
  }

  return PERMISSION_LEVELS.EVERYONE;
}

// Komut yetki gereksinimlerini tanımla (artık oto ayarlanacak)
const COMMAND_PERMISSIONS = {};

// Yetki seviyesi isimlerini al
function getPermissionLevelName(level) {
  switch(level) {
    case PERMISSION_LEVELS.EVERYONE: return 'Herkes';
    case PERMISSION_LEVELS.MODERATOR: return 'Moderatör';
    case PERMISSION_LEVELS.ADMINISTRATOR: return 'Yönetici';
    case PERMISSION_LEVELS.OWNER: return 'Sunucu Sahibi';
    default: return 'Bilinmeyen';
  }
}

// Komutlar
// --------------------------------------------------
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());

    // oto yetki atama
    if (command.permissionLevel) {
      COMMAND_PERMISSIONS[command.data.name] = PERMISSION_LEVELS[command.permissionLevel.toUpperCase()] || PERMISSION_LEVELS.EVERYONE;
    } else {
      COMMAND_PERMISSIONS[command.data.name] = PERMISSION_LEVELS.EVERYONE;
    }

    console.log(`Komut yüklendi: ${command.data.name} | Yetki: ${command.permissionLevel || "EVERYONE"}`);
  } else {
    console.log(`Komut eksik veya hatalı: ${file}`);
  }
}

// Olaylar (Events)
// --------------------------------------------------
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.name) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`Olay yüklendi: ${event.name}${event.once ? " (Bir Kez)" : ""}`);
  } else {
    console.log(`Olay eksik veya hatalı: ${file} (name özelliği eksik)`);
  }
}

// Bot hazır olduğunda
client.once(Events.ClientReady, async () => {
  console.log(`Discord bot giriş yaptı: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log("Slash komutları başarıyla yüklendi.");
  } catch (err) {
    console.error("Komut yükleme hatası:", err);
  }

  // 🔥 OTO YETKİLENDİRME + ROL EŞLEŞTİRME SİSTEMİ 🔥
  try {
    console.log("Tüm komutlar Discord API'den taranıyor...");
    const globalCommands = await rest.get(Routes.applicationCommands(client.user.id));

    for (const cmd of globalCommands) {
      const cmdName = cmd.name.toLowerCase();

      // Eğer komut zaten listede yoksa, otomatik ekle
      if (!COMMAND_PERMISSIONS[cmdName]) {
        let level = PERMISSION_LEVELS.EVERYONE;

        // Otomatik akıllı yetki atama
        if (["ban", "kick", "mute", "warn"].some(k => cmdName.includes(k))) {
          level = PERMISSION_LEVELS.MODERATOR;
        } else if (["addrole", "removerole", "set"].some(k => cmdName.includes(k))) {
          level = PERMISSION_LEVELS.ADMINISTRATOR;
        } else if (["owner", "reload", "eval"].some(k => cmdName.includes(k))) {
          level = PERMISSION_LEVELS.OWNER;
        }

        COMMAND_PERMISSIONS[cmdName] = level;
        console.log(`Yeni komut bulundu (API): /${cmdName} | Otomatik Yetki: ${getPermissionLevelName(level)}`);
      }
    }

    console.log(`✅ Toplam ${Object.keys(COMMAND_PERMISSIONS).length} komut yetkilendirildi.`);
  } catch (err) {
    console.error("Otomatik komut tarama hatası:", err);
  }

  // Roblox giriş kontrolü
  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`Roblox giriş başarılı! Kullanıcı: ${currentUser.UserName} (ID: ${currentUser.UserID})`);
  } catch (err) {
    console.error("Roblox giriş başarısız:", err.message);
  }
});

// Slash komut etkileşimleri
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Kullanıcının yetki seviyesini kontrol et
  const userPermissionLevel = checkPermissionLevel(interaction.member);
  const requiredPermissionLevel = COMMAND_PERMISSIONS[interaction.commandName] || PERMISSION_LEVELS.EVERYONE;

  if (userPermissionLevel < requiredPermissionLevel) {
    const requiredLevelName = getPermissionLevelName(requiredPermissionLevel);
    const userLevelName = getPermissionLevelName(userPermissionLevel);

    console.log(`Yetkisiz komut: ${interaction.user.tag} (${userLevelName}) /${interaction.commandName}`);
    
    return interaction.reply({
      content: `❌ Bu komutu kullanmak için **${requiredLevelName}** yetkisine sahip olmanız gerekiyor.\nMevcut yetkiniz: **${userLevelName}**`,
      ephemeral: true
    });
  }

  try {
    console.log(`Komut kullanıldı: ${interaction.user.tag} /${interaction.commandName}`);
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`Komut hatası (${interaction.commandName}):`, err);
    const errorMessage = "Komut çalıştırılırken bir hata oluştu. Lütfen tekrar deneyin.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Üye katıldığında
client.on(Events.GuildMemberAdd, async member => {
  const ehliyet = await client.db.get(`ehliyet_${member.id}`); // client.db ve await kullanıldı
  if (!ehliyet) {
    member.send("Sunucuya hoş geldiniz! Ehliyetiniz yok. /ehliyet-al komutunu kullanabilirsiniz.")
      .catch(() => console.log(`${member.user.tag} kullanıcısına özel mesaj gönderilemedi.`));
  }
});

// Üye ayrıldığında
client.on(Events.GuildMemberRemove, async member => {
  const ehliyet = await client.db.get(`ehliyet_${member.id}`); // client.db ve await kullanıldı
  if (ehliyet) {
    console.log(`${member.user.tag} sunucudan ayrıldı. Ehliyet durumu: ${ehliyet.durum}`);
  }
});

// Hata yakalama
process.on('unhandledRejection', error => console.error('Promise hatası:', error));
process.on('uncaughtException', error => {
  console.error('Exception:', error);
  process.exit(1);
});

client.login(process.env.TOKEN);
