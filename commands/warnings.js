const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  REST, 
  Routes, 
  PermissionFlagsBits 
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans 
  ]
});

/* ================= KOMUT TANIMLARI ================= */
const commands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir kullanıcıyı sunucudan yasaklar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("kullanici").setDescription("Yasaklanacak kişi").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Yasaklama sebebi").setRequired(false)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Bir kullanıcının yasaklamasını kaldırır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName("id").setDescription("Yasağı kaldırılacak kullanıcı ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ban-listesi")
    .setDescription("Sunucudaki yasaklı kullanıcıları listeler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
].map(c => c.toJSON());

/* ================= BOT READY ================= */
client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ ${client.user.tag} Yasaklama ve Liste sistemi aktif!`);
  } catch (err) { console.error(err); }
});

/* ================= INTERACTION ÇALIŞTIRICI ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // --- BAN LİSTESİ KOMUTU ---
  if (interaction.commandName === "ban-listesi") {
    await interaction.deferReply();

    try {
      const bans = await interaction.guild.bans.fetch();
      if (bans.size === 0) return interaction.editReply("📂 Sunucuda yasaklı kullanıcı bulunmuyor.");

      // Banlıları listele (İlk 20 kişiyi gösterir, karakter sınırı için)
      const list = bans.map(b => `**${b.user.tag}** (\`${b.user.id}\`)`).join("\n");
      const shortList = list.length > 2000 ? list.substring(0, 1900) + "..." : list;

      const embed = new EmbedBuilder()
        .setTitle("🚫 Sunucu Yasaklılar Listesi")
        .setDescription(shortList)
        .setColor("Yellow")
        .setFooter({ text: `Toplam ${bans.size} yasaklı bulunuyor.` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Ban listesi alınırken bir hata oluştu.");
    }
  }

  // --- BAN KOMUTU ---
  if (interaction.commandName === "ban") {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("kullanici");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) 
        return interaction.editReply("❌ Benim yetkim yok!");

    if (targetMember && !targetMember.bannable) 
        return interaction.editReply("❌ Bu kullanıcıyı banlayamam, yetkim yetmiyor.");

    try {
      await interaction.guild.members.ban(targetUser.id, { reason });
      await interaction.editReply(`✅ **${targetUser.tag}** yasaklandı. Sebep: \`${reason}\``);
    } catch (err) { await interaction.editReply("❌ Hata oluştu."); }
  }

  // --- UNBAN KOMUTU ---
  if (interaction.commandName === "unban") {
    await interaction.deferReply();
    const userId = interaction.options.getString("id");
    try {
      await interaction.guild.bans.remove(userId);
      await interaction.editReply(`✅ \`${userId}\` ID'li kullanıcının yasağı kaldırıldı.`);
    } catch (err) { await interaction.editReply("❌ Yasak bulunamadı."); }
  }
});

client.login(process.env.TOKEN);
