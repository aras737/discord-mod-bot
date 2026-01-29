const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildBans
  ]
});

// --- KOMUTLAR ---
const commands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Kullanıcıyı sunucudan yasaklar")
    .addUserOption(o => o.setName("kullanici").setDescription("Yasaklanacak üye").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Yasaklama sebebi").setRequired(true)),
  new SlashCommandBuilder()
    .setName("ban-listesi")
    .setDescription("Discord sistemindeki yasaklıları listeler")
].map(c => c.toJSON());

client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Akademi Yasaklama Sistemi Aktif!");
  } catch (err) { console.error(err); }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // --- BAN LİSTESİ (Discord Sisteminden Çeker) ---
  if (interaction.commandName === "ban-listesi") {
    // Önce gizlice yanıt ver (Kimin kullandığı görünmesin diye)
    await interaction.reply({ content: "Veriler çekiliyor...", ephemeral: true });

    try {
      // Discord'un kendi yasaklar sisteminden verileri çekiyoruz
      const fetchBans = await interaction.guild.bans.fetch();
      
      const embed = new EmbedBuilder()
        .setColor("#2f3136") // Discord koyu tema rengi
        .setTitle("🔨 Yasaklar") // Attığın görseldeki başlık
        .setTimestamp();

      if (fetchBans.size === 0) {
        embed.setDescription("Sunucuda aktif bir yasaklama bulunmuyor.");
      } else {
        // Discord'un tanıdığı verileri (User + Reason) sıralıyoruz
        const banList = fetchBans.map(ban => `• **${ban.user.tag}**\n  └ ID: \`${ban.user.id}\`\n  └ Sebep: *${ban.reason || "Sebep girilmemiş"}*`).join("\n\n");
        
        embed.setDescription(banList.length > 4000 ? banList.substring(0, 3950) + "..." : banList);
      }

      // Ana mesajı kanala isimsiz at
      await interaction.channel.send({ embeds: [embed] });
      
      // Kullanıcı bilgisini (Aras kullandı vs.) siler
      return interaction.deleteReply();
    } catch (err) {
      console.error(err);
      return interaction.editReply("❌ Yasaklar listesine erişilemedi. Yetkilerimi kontrol et.");
    }
  }

  // --- BAN KOMUTU ---
  if (interaction.commandName === "ban") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) 
        return interaction.reply({ content: "Yetkin yok.", ephemeral: true });

    const target = interaction.options.getUser("kullanici");
    const reason = interaction.options.getString("sebep");

    await interaction.reply({ content: "Yasaklanıyor...", ephemeral: true });

    try {
      // Discord sistemine banı işler
      await interaction.guild.members.ban(target.id, { reason });

      const successEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({ name: "Akademi Başkanlığı | Bilgi", iconURL: "https://i.ibb.co/L6vVv9N/akademi-logo.png" })
        .setDescription(`✅ **${target.tag}**, Discord yasaklar sistemine işlendi.\n**Sebep:** ${reason}`)
        .setTimestamp();

      await interaction.channel.send({ embeds: [successEmbed] });
      return interaction.deleteReply();
    } catch (err) {
      return interaction.editReply("❌ Hata: Bu kişiyi yasaklayamıyorum (Rütbesi benden yüksek olabilir).");
    }
  }
});

client.login(process.env.TOKEN);
