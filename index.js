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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.db = new QuickDB();

/* ================= AYAR ================= */

const ALLOWED_USERS = [
  "752639955049644034",
  "1389930042200559706"
];

/* ================= SLASH KOMUT ================= */

const rolYetkiCommand = new SlashCommandBuilder()
  .setName("rol-yetki")
  .setDescription("Rol yetki sistemi")

  .addSubcommand(sub =>
    sub.setName("ekle")
      .setDescription("Role seviye ver")
      .addRoleOption(o =>
        o.setName("rol")
          .setDescription("Rol")
          .setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("seviye")
          .setDescription("Yetki seviyesi")
          .setRequired(true)
      )
  )

  .addSubcommand(sub =>
    sub.setName("sil")
      .setDescription("Rol yetkisini sil")
      .addRoleOption(o =>
        o.setName("rol")
          .setDescription("Rol")
          .setRequired(true)
      )
  )

  .addSubcommand(sub =>
    sub.setName("liste")
      .setDescription("Yetkili roller listesi")
  )

  .addSubcommand(sub =>
    sub.setName("kontrol")
      .setDescription("Komut seviyesi kontrol")
      .addIntegerOption(o =>
        o.setName("seviye")
          .setDescription("Gerekli seviye")
          .setRequired(true)
      )
  );

/* ================= READY ================= */

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [rolYetkiCommand.toJSON()] }
    );
    console.log("✅ Slash komut yüklendi: /rol-yetki");
  } catch (err) {
    console.error("❌ Slash yükleme hatası:", err);
  }

  try {
    await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log("🟢 Roblox giriş başarılı");
  } catch {
    console.log("⚠️ Roblox cookie yok / geçersiz");
  }
});

/* ================= INTERACTION ================= */

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "rol-yetki") return;

  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    return interaction.reply({
      content: "Bu komutu kullanamazsın.",
      ephemeral: true
    });
  }

  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;

  if (sub === "ekle") {
    const rol = interaction.options.getRole("rol");
    const seviye = interaction.options.getInteger("seviye");

    await client.db.set(`yetki.${guildId}.${rol.id}`, seviye);

    const embed = new EmbedBuilder()
      .setTitle("Rol Yetkisi Verildi")
      .addFields(
        { name: "Rol", value: `<@&${rol.id}>`, inline: true },
        { name: "Seviye", value: String(seviye), inline: true }
      )
      .setColor(0x2f3136);

    return interaction.reply({ embeds: [embed] });
  }

  if (sub === "sil") {
    const rol = interaction.options.getRole("rol");
    await client.db.delete(`yetki.${guildId}.${rol.id}`);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Rol Yetkisi Silindi")
          .setDescription(`<@&${rol.id}>`)
          .setColor(0x2f3136)
      ]
    });
  }

  if (sub === "liste") {
    const data = await client.db.get(`yetki.${guildId}`) || {};
    const list = Object.entries(data)
      .map(([rol, seviye]) => `<@&${rol}> → Seviye ${seviye}`)
      .join("\n");

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Yetkili Roller")
          .setDescription(list || "Yetkili rol yok.")
          .setColor(0x2f3136)
      ]
    });
  }

  if (sub === "kontrol") {
    const gerekli = interaction.options.getInteger("seviye");
    const memberRoles = interaction.member.roles.cache;

    let max = 0;
    for (const role of memberRoles.values()) {
      const s = await client.db.get(`yetki.${guildId}.${role.id}`);
      if (s && s > max) max = s;
    }

    return interaction.reply({
      content: max >= gerekli
        ? `Yetkin yeterli. (Seviye ${max})`
        : `Yetkin yetersiz. (Sen: ${max} | Gerekli: ${gerekli})`,
      ephemeral: true
    });
  }
});

/* ================= HATALAR ================= */

process.on("unhandledRejection", err => console.error(err));
process.on("uncaughtException", err => {
  console.error(err);
  process.exit(1);
});

client.login(process.env.TOKEN);
