const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans // Ban kontrolü için şart
  ]
});

/* ---------------- SLASH KOMUTLAR ---------------- */

const commands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir kullanıcıyı banlar")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // Sadece yetkisi olanlar komutu görebilir
    .addUserOption(opt => opt.setName("kullanici").setDescription("Banlanacak kişi").setRequired(true))
    .addStringOption(opt => opt.setName("sebep").setDescription("Ban sebebi").setRequired(false)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Bir kullanıcının banını açar")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt => opt.setName("id").setDescription("Banı açılacak kullanıcı ID").setRequired(true))
].map(cmd => cmd.toJSON());

/* ---------------- KOMUT YÜKLEME ---------------- */

client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ ${client.user.tag} Aktif ve Komutlar Yüklendi!`);
  } catch (e) { console.error(e); }
});

/* ---------------- INTERACTION ---------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // BAN KOMUTU
  if (interaction.commandName === "ban") {
    await interaction.deferReply(); // "Uygulama yanıt vermedi" hatasını önler

    const user = interaction.options.getUser("kullanici");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi";
    const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);

    // 1. Yetki Kontrolü
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) 
      return interaction.editReply("❌ Bu komutu kullanmak için `Üyeleri Yasakla` yetkin olmalı.");

    // 2. Botun Yetki Kontrolü
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
      return interaction.editReply("❌ Benim üyeleri yasaklama yetkim yok!");

    if (targetMember) {
      // 3. Hiyerarşi Kontrolü (Botun rolü üyenin üstünde mi?)
      if (!targetMember.bannable) 
        return interaction.editReply("❌ Bu kullanıcıyı banlayamıyorum. Rolü benden yüksek veya eşit.");
      
      // 4. Kullanıcıyı banlayan kişi ile hedef arasındaki hiyerarşi
      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position)
        return interaction.editReply("❌ Senle aynı veya senden üst rütbedeki birini banlayamazsın!");
    }

    try {
      await interaction.guild.members.ban(user.id, { reason });
      const embed = new EmbedBuilder()
        .setTitle("🚫 Kullanıcı Yasaklandı")
        .addFields(
          { name: "Kullanıcı", value: `\`${user.tag}\` (${user.id})`, inline: true },
          { name: "Yetkili", value: `${interaction.user}`, inline: true },
          { name: "Sebep", value: `\`${reason}\`` }
        )
        .setColor("Red").setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply("❌ Ban atılırken bir hata oluştu.");
    }
  }

  // UNBAN KOMUTU
  if (interaction.commandName === "unban") {
    await interaction.deferReply();
    const id = interaction.options.getString("id");

    try {
      await interaction.guild.bans.remove(id);
      const embed = new EmbedBuilder()
        .setTitle("✅ Yasak Kaldırıldı")
        .setDescription(`ID: \`${id}\` kullanıcısının yasaklaması kaldırıldı.`)
        .setColor("Green").setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply("❌ Bu ID'ye sahip bir yasaklama bulunamadı.");
    }
  }
});

/* ---------------- OTOMATİK KORUMA ---------------- */

client.on("guildMemberAdd", async member => {
  // Kullanıcı sunucuya girdiğinde banlı mı diye tekil kontrol (Daha hızlı)
  const isBanned = await member.guild.bans.fetch(member.id).catch(() => null);
  
  if (isBanned) {
    try {
      await member.send(`⚠️ **${member.guild.name}** sunucusunda banlı olduğunuz için otomatik olarak tekrar yasaklandınız.`).catch(() => null);
      await member.ban({ reason: "Yasaklı hesap otomatik koruma." });
    } catch (err) {
      console.error("Oto-ban hatası:", err);
    }
  }
});

client.login(TOKEN);
