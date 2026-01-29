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

/* ================= BOT HAZIR ================= */
client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ ${client.user.tag} Yasaklama Sistemi Yayında!`);
  } catch (err) { console.error(err); }
});

/* ================= KOMUT ÇALIŞTIRICI ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // --- BAN LİSTESİ (EMBEDLİ) ---
  if (interaction.commandName === "ban-listesi") {
    await interaction.deferReply();

    try {
      const bans = await interaction.guild.bans.fetch();
      
      if (bans.size === 0) {
        return interaction.editReply({ 
          embeds: [new EmbedBuilder().setColor("Yellow").setDescription("📂 Sunucuda yasaklı kullanıcı bulunmuyor.")] 
        });
      }

      // Banlıları şık bir şekilde listele
      const list = bans.map(b => `👤 **${b.user.tag}** \n🆔 \`${b.user.id}\` \n📄 Sebep: *${b.reason || "Belirtilmemiş"}*`).join("\n\n");
      
      // Discord 4096 karakter sınırı kontrolü
      const cleanList = list.length > 3900 ? list.substring(0, 3900) + "..." : list;

      const embed = new EmbedBuilder()
        .setTitle("🚫 Sunucu Yasaklılar Listesi")
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setDescription(cleanList)
        .setColor("#ff0000")
        .setFooter({ text: `Toplam ${bans.size} yasaklı kayıtlı.`, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Ban listesi yüklenirken bir hata oluştu.");
    }
  }

  // --- BAN KOMUTU (EMBEDLİ) ---
  if (interaction.commandName === "ban") {
    await interaction.deferReply();
    const user = interaction.options.getUser("kullanici");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) return interaction.editReply("❌ Bu kullanıcıyı banlamaya yetkim yetmiyor.");

    try {
      await interaction.guild.members.ban(user.id, { reason });
      const embed = new EmbedBuilder()
        .setTitle("🚫 Kullanıcı Yasaklandı")
        .addFields(
          { name: "Kullanıcı", value: `${user.tag}`, inline: true },
          { name: "Yetkili", value: `${interaction.user}`, inline: true },
          { name: "Sebep", value: `\`${reason}\`` }
        )
        .setColor("Red")
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch { await interaction.editReply("❌ Ban atılamadı."); }
  }

  // --- UNBAN KOMUTU (EMBEDLİ) ---
  if (interaction.commandName === "unban") {
    await interaction.deferReply();
    const id = interaction.options.getString("id");

    try {
      await interaction.guild.bans.remove(id);
      const embed = new EmbedBuilder()
        .setTitle("✅ Yasak Kaldırıldı")
        .setDescription(`\`${id}\` ID'li kullanıcının yasağı başarıyla açıldı.`)
        .setColor("Green")
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch { await interaction.editReply("❌ Bu ID'ye ait bir yasaklama bulunamadı."); }
  }
});

client.login(process.env.TOKEN);
