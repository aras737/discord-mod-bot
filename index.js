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
const db = require("quick.db");
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
function checkPermissionLevel(member, requiredLevel) {
  // Sunucu sahibi kontrolü
  if (member.guild.ownerId === member.id) {
    return PERMISSION_LEVELS.OWNER;
  }

  // Yönetici yetkisi kontrolü
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return PERMISSION_LEVELS.ADMINISTRATOR;
  }

  // Moderatör yetkileri kontrolü
  const moderatorPermissions = [
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ModerateMembers
  ];

  const hasModerationPerms = moderatorPermissions.some(perm => 
    member.permissions.has(perm)
  );

  if (hasModerationPerms) {
    return PERMISSION_LEVELS.MODERATOR;
  }

  return PERMISSION_LEVELS.EVERYONE;
}

// Komut yetki gereksinimlerini tanımla
const COMMAND_PERMISSIONS = {
  // Herkes kullanabilir
  'ehliyet-al': PERMISSION_LEVELS.EVERYONE,
  'ehliyet-sorgula': PERMISSION_LEVELS.EVERYONE,
  'profil': PERMISSION_LEVELS.EVERYONE,
  'yardim': PERMISSION_LEVELS.EVERYONE,

  // Moderatör yetkileri
  'kick': PERMISSION_LEVELS.MODERATOR,
  'mute': PERMISSION_LEVELS.MODERATOR,
  'warn': PERMISSION_LEVELS.MODERATOR,
  'clear': PERMISSION_LEVELS.MODERATOR,
  'slowmode': PERMISSION_LEVELS.MODERATOR,

  // Yönetici yetkileri
  'ban': PERMISSION_LEVELS.ADMINISTRATOR,
  'unban': PERMISSION_LEVELS.ADMINISTRATOR,
  'banlist': PERMISSION_LEVELS.ADMINISTRATOR,
  'role': PERMISSION_LEVELS.ADMINISTRATOR,
  'channel': PERMISSION_LEVELS.ADMINISTRATOR,
  'server-settings': PERMISSION_LEVELS.ADMINISTRATOR,

  // Sunucu sahibi yetkileri
  'eval': PERMISSION_LEVELS.OWNER,
  'restart': PERMISSION_LEVELS.OWNER,
  'backup': PERMISSION_LEVELS.OWNER
};

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

// Commands klasöründen komutları yükle
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

  // Yetki kontrolü
  if (userPermissionLevel < requiredPermissionLevel) {
    const requiredLevelName = getPermissionLevelName(requiredPermissionLevel);
    const userLevelName = getPermissionLevelName(userPermissionLevel);
    
    console.log(`Yetkisiz komut kullanımı: ${interaction.user.tag} (${userLevelName}) /${interaction.commandName} komutunu kullanmaya çalıştı. Gerekli yetki: ${requiredLevelName}`);
    
    return interaction.reply({
      content: `Bu komutu kullanmak için ${requiredLevelName} yetkisine sahip olmanız gerekiyor. Mevcut yetki seviyeniz: ${userLevelName}`,
      ephemeral: true
    });
  }

  // Komut çalıştırma
  try {
    console.log(`Komut kullanıldı: ${interaction.user.tag} /${interaction.commandName}`);
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`Komut hatası (${interaction.commandName}):`, err);
    
    const errorMessage = "Komut çalıştırılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Sunucuya yeni üye katıldığında
client.on(Events.GuildMemberAdd, member => {
  const ehliyet = db.get(`ehliyet_${member.id}`);
  if (!ehliyet) {
    member.send("Sunucuya hoş geldiniz! Ehliyetiniz bulunmamaktadır. Ehliyet almak için /ehliyet-al komutunu kullanabilirsiniz.")
      .catch(() => console.log(`${member.user.tag} kullanıcısına özel mesaj gönderilemedi.`));
  }
});

// Üye sunucudan ayrıldığında
client.on(Events.GuildMemberRemove, member => {
  const ehliyet = db.get(`ehliyet_${member.id}`);
  if (ehliyet) {
    console.log(`${member.user.tag} sunucudan ayrıldı. Ehliyet durumu: ${ehliyet.durum}`);
  }
});

// Hata yakalama
process.on('unhandledRejection', error => {
  console.error('Yakalanmamış Promise hatası:', error);
});

process.on('uncaughtException', error => {
  console.error('Yakalanmamış Exception hatası:', error);
  process.exit(1);
});

client.login(process.env.TOKEN);
