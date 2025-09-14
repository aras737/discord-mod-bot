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
const db = require("quick.db");

// 📌 Discord Client
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

// 📂 commands klasöründen komutları yükle
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: ${command.data.name}`);
  } else {
    console.log(`⚠️ Komut eksik: ${file}`);
  }
}

// ✅ Slash komutlarını Discord'a kaydet
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log("✅ Slash komutları başarıyla yüklendi.");
  } catch (err) {
    console.error(err);
  }
});

// 🎯 Slash komutlar & rol tabanlı otomatik yetki
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const member = interaction.member;
  const memberHighestRole = member.roles.highest;

  // Komutun default izinleri (PermissionFlagsBits)
  const requiredPerms = command.data.default_member_permissions || 0n;

  // Sunucudaki tüm rolleri kontrol et
  const roles = interaction.guild.roles.cache
    .sort((a, b) => b.position - a.position)
    .filter(r => r.permissions.has(requiredPerms));

  // Kullanıcının rolü yeterli mi?
  const isAuthorized = roles.some(role => memberHighestRole.position >= role.position);

  if (!isAuthorized) {
    console.log(`❌ Yetkisiz Komut Kullanımı: ${interaction.user.tag} /${interaction.commandName}`);
    return interaction.reply({
      content: "❌ Bu komutu kullanmak için yeterli role sahip değilsin."
    });
  }

  // Komutu çalıştır
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Komut çalıştırılamadı!" });
    } else {
      await interaction.reply({ content: "❌ Komut çalıştırılamadı!" });
    }
  }
});

// 🎯 EHLIYET EVENTLERİ
client.on(Events.GuildMemberAdd, member => {
  const ehliyet = db.get(`ehliyet_${member.id}`);
  if (!ehliyet) {
    member.send("👋 Sunucuya hoş geldin! Ehliyetin yok, almak için `/ehliyet-al` komutunu kullanabilirsin. 🚗💨")
      .catch(() => console.log("Kullanıcıya DM gönderilemedi."));
  }
});

client.on(Events.GuildMemberRemove, member => {
  const ehliyet = db.get(`ehliyet_${member.id}`);
  if (ehliyet) {
    console.log(`📌 ${member.user.tag} sunucudan ayrıldı. Ehliyeti: ${ehliyet.durum}`);
  }
});

client.login(process.env.TOKEN);
