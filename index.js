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
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const noblox = require("noblox.js");

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.db = new QuickDB();
client.commands = new Collection();
const commands = [];

/* ================= AYARLAR ================= */

const ALLOWED_USERS = [
  "1389930042200559706",
  "1385277307106885722"
];

const GUILD_ID = process.env.GUILD_ID;

/* ================= SLASH KOMUT (BURASI ÖNEMLİ) ================= */

// 🔥 KOMUTU ELLE EKLİYORUZ
const bilgiCommand = new SlashCommandBuilder()
  .setName("bilgi")
  .setDescription("Bot bilgilerini gösterir");

client.commands.set("bilgi", {
  data: bilgiCommand,
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("TFA | İttifak Ordusu")
      .setDescription("Slash komut sistemi çalışıyor.")
      .setColor(0x2f3136)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

commands.push(bilgiCommand.toJSON());

/* ================= READY ================= */

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );
    console.log("🚀 Slash komutlar sunucuya yüklendi");
  } catch (err) {
    console.error("❌ Slash yükleme hatası:", err);
  }

  if (process.env.ROBLOX_COOKIE) {
    try {
      const user = await noblox.setCookie(process.env.ROBLOX_COOKIE);
      console.log(`🟢 Roblox giriş başarılı: ${user.UserName}`);
    } catch {
      console.log("⚠️ Roblox cookie geçersiz");
    }
  }
});

/* ================= INTERACTION ================= */

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    return interaction.reply({
      content: "❌ Bu komutu kullanamazsın.",
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, client);
    console.log(`✅ /${interaction.commandName} kullanıldı`);
  } catch (err) {
    console.error("Komut hatası:", err);
    await interaction.reply({ content: "❌ Komut hatası.", ephemeral: true });
  }
});

/* ================= HATALAR ================= */

process.on("unhandledRejection", err => console.error("Promise:", err));
process.on("uncaughtException", err => {
  console.error("Exception:", err);
  process.exit(1);
});

client.login(process.env.TOKEN);
