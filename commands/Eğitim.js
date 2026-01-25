const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  Events
} = require("discord.js");
const { QuickDB } = require("quick.db");
const express = require("express"); // Railway uyumu için

const db = new QuickDB();
const app = express();
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// 🌐 Railway Port Ayarı (Botun "Crashed" vermesini engeller)
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("🚀 Bot Roket Gibi Çalışıyor!"));
app.listen(PORT, () => console.log(`📡 Web Sunucusu ${PORT} portunda aktif.`));

/* =======================
   SLASH KOMUT TANIMI
======================= */
const yetkiCommand = new SlashCommandBuilder()
  .setName("yetki")
  .setDescription("Yetki yönetim sistemi")
  .addSubcommand(sub =>
    sub.setName("rol").setDescription("Role yetki ver")
      .addRoleOption(o => o.setName("rol").setDescription("Rol").setRequired(true))
      .addIntegerOption(o => o.setName("seviye").setDescription("Yetki seviyesi").setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName("komut").setDescription("Komuta yetki ver")
      .addStringOption(o => o.setName("isim").setDescription("Komut adı").setRequired(true))
      .addIntegerOption(o => o.setName("seviye").setDescription("Yetki seviyesi").setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName("sil").setDescription("Yetki sil")
      .addStringOption(o => o.setName("tur").setDescription("Yetki türü").setRequired(true)
        .addChoices({ name: "Rol", value: "rol" }, { name: "Komut", value: "komut" }))
      .addStringOption(o => o.setName("id").setDescription("Rol ID / Komut adı").setRequired(true))
  )
  .addSubcommand(sub => sub.setName("liste").setDescription("Yetki listesini gösterir"))
  .addSubcommand(sub =>
    sub.setName("log").setDescription("Yetki log kanalı ayarla")
      .addChannelOption(o => o.setName("kanal").setDescription("Log kanalı").setRequired(true))
  );

/* =======================
   BOT READY
======================= */
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
  
  // Global Komut Kaydı (Railway'de roket hızında yüklenmesi için)
  try {
    await client.application.commands.set([yetkiCommand.toJSON()]);
    console.log("✅ Slash komutları başarıyla güncellendi.");
  } catch (err) {
    console.error("❌ Komut yükleme hatası:", err);
  }
});

/* =======================
   YETKİ SEVİYESİ BUL
======================= */
async function getUserLevel(member, guildId) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return 100; // Admin her zaman en üst seviye
  let level = 0;
  const roles = await db.get(`yetki.${guildId}.roller`) || {};
  
  member.roles.cache.forEach(role => {
    if (roles[role.id] && roles[role.id] > level) level = roles[role.id];
  });
  return level;
}

/* =======================
   INTERACTION
======================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "yetki") return;

  const guildId = interaction.guild.id;
  const sub = interaction.options.getSubcommand();

  // Railway'de zaman aşımını önlemek için deferReply
  await interaction.deferReply({ ephemeral: true });

  const userLevel = await getUserLevel(interaction.member, guildId);
  
  // Yetki Kontrolü (Komutu kullanmak için seviye 3 veya admin lazım)
  if (userLevel < 3) {
    return interaction.editReply("❌ Bu sistem üzerinde yetkiniz bulunmuyor (Seviye 3+ gerekli).");
  }

  const logId = await db.get(`yetki.${guildId}.log`);
  const logChannel = logId ? interaction.guild.channels.cache.get(logId) : null;

  if (sub === "log") {
    const kanal = interaction.options.getChannel("kanal");
    await db.set(`yetki.${guildId}.log`, kanal.id);
    return interaction.editReply(`✅ Log kanalı ayarlandı: ${kanal}`);
  }

  if (sub === "rol") {
    const rol = interaction.options.getRole("rol");
    const seviye = interaction.options.getInteger("seviye");

    await db.set(`yetki.${guildId}.roller.${rol.id}`, seviye);

    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setTitle("🔒 Yetki Güncellendi")
            .setDescription(`**${interaction.user.tag}** bir role yetki tanımladı.`)
            .addFields(
                { name: "Rol", value: `${rol}`, inline: true },
                { name: "Yeni Seviye", value: `${seviye}`, inline: true }
            )
            .setColor("Blue").setTimestamp();
        logChannel.send({ embeds: [logEmbed] }).catch(() => null);
    }

    return interaction.editReply(`✅ **${rol.name}** artık **Seviye ${seviye}** yetkisine sahip.`);
  }

  if (sub === "komut") {
    const isim = interaction.options.getString("isim");
    const seviye = interaction.options.getInteger("seviye");
    await db.set(`yetki.${guildId}.komutlar.${isim}`, seviye);
    return interaction.editReply(`✅ **${isim}** komutu artık **Seviye ${seviye}** ve üzeri tarafından kullanılabilir.`);
  }

  if (sub === "sil") {
    const tur = interaction.options.getString("tur");
    const id = interaction.options.getString("id");
    await db.delete(`yetki.${guildId}.${tur === "rol" ? "roller" : "komutlar"}.${id}`);
    return interaction.editReply("✅ Kayıt başarıyla silindi.");
  }

  if (sub === "liste") {
    const roller = await db.get(`yetki.${guildId}.roller`) || {};
    const komutlar = await db.get(`yetki.${guildId}.komutlar`) || {};

    const roleList = Object.entries(roller).map(([r, l]) => `<@&${r}> → \`Seviye ${l}\``).join("\n") || "Yok";
    const commandList = Object.entries(komutlar).map(([k, l]) => `\`/${k}\` → \`Seviye ${l}\``).join("\n") || "Yok";

    const embed = new EmbedBuilder()
      .setTitle("🎖️ Ordu Yetki Hiyerarşisi")
      .addFields(
        { name: "Rol Yetkileri", value: roleList },
        { name: "Komut Kısıtlamaları", value: commandList }
      )
      .setColor("Green").setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
});

// Railway'de TOKEN'i "Variables" kısmına eklemeyi unutma!
client.login(process.env.TOKEN);
