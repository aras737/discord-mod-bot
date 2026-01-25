const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  Events
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

/* =========================
   SLASH KOMUT
========================= */
const data = new SlashCommandBuilder()
  .setName("yetki")
  .setDescription("Rol ve komut yetki sistemi")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

  // ROL AYAR
  .addSubcommand(sub =>
    sub
      .setName("rol")
      .setDescription("Role yetki seviyesi ver")
      .addRoleOption(o =>
        o.setName("rol").setDescription("Rol").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("seviye").setDescription("Yetki seviyesi").setRequired(true)
      )
  )

  // KOMUT AYAR
  .addSubcommand(sub =>
    sub
      .setName("komut")
      .setDescription("Komuta yetki seviyesi ver")
      .addStringOption(o =>
        o.setName("komut").setDescription("Komut adı").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("seviye").setDescription("Gerekli seviye").setRequired(true)
      )
  )

  // YETKİ SİL
  .addSubcommand(sub =>
    sub
      .setName("sil")
      .setDescription("Rol veya komut yetkisini sil")
      .addStringOption(o =>
        o.setName("tip")
          .setDescription("rol / komut")
          .setRequired(true)
          .addChoices(
            { name: "Rol", value: "rol" },
            { name: "Komut", value: "komut" }
          )
      )
      .addStringOption(o =>
        o.setName("isim")
          .setDescription("Rol ID veya komut adı")
          .setRequired(true)
      )
  )

  // YETKİ LİSTE
  .addSubcommand(sub =>
    sub
      .setName("liste")
      .setDescription("Tüm yetki ayarlarını listeler")
  )

  // LOG KANALI
  .addChannelOption(o =>
    o
      .setName("log")
      .setDescription("Yetki log kanalı")
      .setRequired(false)
  );

/* =========================
   EXECUTE
========================= */
async function execute(interaction) {
  const guildId = interaction.guild.id;
  const sub = interaction.options.getSubcommand();

  // LOG KANAL AYARI
  const logChannel = interaction.options.getChannel("log");
  if (logChannel) {
    await db.set(`yetki.log.${guildId}`, logChannel.id);
  }

  const logId = await db.get(`yetki.log.${guildId}`);
  const logCh = logId
    ? interaction.guild.channels.cache.get(logId)
    : null;

  /* ---------- ROL ---------- */
  if (sub === "rol") {
    const role = interaction.options.getRole("rol");
    const level = interaction.options.getInteger("seviye");

    await db.set(`yetki.roles.${guildId}.${role.id}`, level);

    if (logCh)
      logCh.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Yetki Rol Ayarlandı")
            .setDescription(`${role} → Seviye ${level}`)
            .setColor("Green")
            .setTimestamp()
        ]
      });

    return interaction.reply({ content: "Rol yetkisi ayarlandı.", ephemeral: true });
  }

  /* ---------- KOMUT ---------- */
  if (sub === "komut") {
    const command = interaction.options.getString("komut");
    const level = interaction.options.getInteger("seviye");

    await db.set(`yetki.commands.${guildId}.${command}`, level);

    if (logCh)
      logCh.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Yetki Komut Ayarlandı")
            .setDescription(`/${command} → Seviye ${level}`)
            .setColor("Blue")
            .setTimestamp()
        ]
      });

    return interaction.reply({ content: "Komut yetkisi ayarlandı.", ephemeral: true });
  }

  /* ---------- SİL ---------- */
  if (sub === "sil") {
    const tip = interaction.options.getString("tip");
    const isim = interaction.options.getString("isim");

    if (tip === "rol") {
      await db.delete(`yetki.roles.${guildId}.${isim}`);
    } else {
      await db.delete(`yetki.commands.${guildId}.${isim}`);
    }

    if (logCh)
      logCh.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Yetki Silindi")
            .setDescription(`${tip.toUpperCase()} → ${isim}`)
            .setColor("Red")
            .setTimestamp()
        ]
      });

    return interaction.reply({ content: "Yetki silindi.", ephemeral: true });
  }

  /* ---------- LİSTE ---------- */
  if (sub === "liste") {
    const roles = (await db.get(`yetki.roles.${guildId}`)) || {};
    const commands = (await db.get(`yetki.commands.${guildId}`)) || {};

    const roleList = Object.entries(roles)
      .map(([id, lvl]) => `<@&${id}> → ${lvl}`)
      .join("\n") || "Yok";

    const commandList = Object.entries(commands)
      .map(([cmd, lvl]) => `/${cmd} → ${lvl}`)
      .join("\n") || "Yok";

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Yetki Listesi")
          .addFields(
            { name: "Roller", value: roleList },
            { name: "Komutlar", value: commandList }
          )
          .setColor("DarkGrey")
      ],
      ephemeral: true
    });
  }
}

/* =========================
   EVENT (KORUMA)
========================= */
async function interactionEvent(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guild.id;
  const requiredLevel = await db.get(
    `yetki.commands.${guildId}.${interaction.commandName}`
  );
  if (!requiredLevel) return;

  let userLevel = 0;
  for (const role of interaction.member.roles.cache.values()) {
    const lvl = await db.get(`yetki.roles.${guildId}.${role.id}`);
    if (lvl && lvl > userLevel) userLevel = lvl;
  }

  if (userLevel < requiredLevel) {
    return interaction.reply({
      content: "Bu komutu kullanmak için yetkin yok.",
      ephemeral: true
    });
  }
}

/* =========================
   EXPORT
========================= */
module.exports = {
  data,
  execute,
  name: Events.InteractionCreate,
  async run(interaction) {
    await interactionEvent(interaction);
  }
};
