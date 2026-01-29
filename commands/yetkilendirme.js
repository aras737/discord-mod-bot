const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildBans
  ]
});

const logoURL = "https://i.ibb.co/v6mXmP0/akademi-logo.png"; // Akademi Logosu

/* ================= 1. TÜM KOMUTLARIN TANIMLANMASI ================= */
const commands = [
  new SlashCommandBuilder()
    .setName("egitim-kitapcigi")
    .setDescription("Eğitim kitapçıklarını gösterir"),
  
  new SlashCommandBuilder()
    .setName("madalya-sistemi")
    .setDescription("Madalya ve nişan sistemini gösterir"),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Kullanıcıyı yasaklar")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("kullanici").setDescription("Kişi").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Sebep").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ban-listesi")
    .setDescription("Yasakları gösterir")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
].map(c => c.toJSON());

/* ================= 2. KOMUTLARI DISCORD'A YÜKLEME ================= */
client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    // Bu satır tüm komutları aynı anda yükler, eskiler silinmez
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ ${client.user.tag} Aktif! Tüm komutlar yüklendi.`);
  } catch (err) { console.error(err); }
});

/* ================= 3. KOMUT ÇALIŞTIRICI ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Kimin kullandığı görünmesin diye gizli yanıtla başla
  await interaction.reply({ content: "İşlem yapılıyor...", ephemeral: true });

  // --- EĞİTİM KİTAPÇIĞI ---
  if (interaction.commandName === "egitim-kitapcigi") {
    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setAuthor({ name: "Akademi Başkanlığı", iconURL: logoURL })
      .setTitle("📖 EĞİTİM KİTAPÇIKLARI 📖")
      .setDescription(
        `**[OR-1/A] EĞİTİM KİTAPÇIĞI**\nhttps://docs.google.com/document/d/1cMWaGzAnE0qYiKyfxXRL608ABgjOSogSoUtTZikSWYk/edit?usp=sharing\n\n` +
        `**[OR-1/B] EĞİTİM KİTAPÇIĞI**\nhttps://docs.google.com/document/d/1FMD7mNXIrFa33H9INlOmr3ULbefwR63yV5BePwhGqgM/edit?usp=sharing\n\n` +
        `**[OR-2] EĞİTİM KİTAPÇIĞI**\nhttps://docs.google.com/document/d/1MS-c8spE22DvTHccV2hsWoF99u_pPwsnogHO-IDUDvY/edit?usp=sharing\n\n` +
        `**[OR-3 / OR-9] EĞİTİM KİTAPÇIĞI**\nhttps://docs.google.com/document/d/1ygwULEGoXN4xIioj9PAgK3K89ZSM7-Gkg73V7qfPsso/edit?usp=sharing`
      ) //
      .setFooter({ text: "Akademi işi, Gönül İşi!", iconURL: logoURL });

    await interaction.channel.send({ embeds: [embed] });
  }

  // --- MADALYA SİSTEMİ ---
  if (interaction.commandName === "madalya-sistemi") {
    const embed = new EmbedBuilder()
      .setColor("#3a01ff")
      .setAuthor({ name: "Akademi Başkanlığı", iconURL: logoURL })
      .setTitle("MADALYA SİSTEMİ")
      .setDescription(
        `**Eğitim Tamamlama Madalyaları (Subay)**\n` +
        `Bronz Eğitim Nişanı - 25 Eğitim Tamamlayanlara verilir.\n` +
        `Gümüş Eğitim Nişanı - 30 Eğitimi tamamlayanlara verilir.\n` +
        `Altın Eğitim Nişanı - 40 ve üzeri eğitimi tamamlayanlara verilir.\n\n` +
        `**Aktiflik Madalyaları (Subay & General)**\n` +
        `Aktiflik Rozeti Oyunda 12 Saat Aktif Kalanlara Verilir\n` +
        `Görev Sadakat Madalyası - Düzenli Görev Yapanlara verilir.\n` +
        `Üstün Hizmet madalyası: 20 Saat Aktif kalıp Görevini Yapanlara Verilir.`
      ) //
      .setFooter({ text: "Akademi işi, Gönül İşi!", iconURL: logoURL });

    await interaction.channel.send({ embeds: [embed] });
  }

  // --- BAN LİSTESİ (Yasaklar) ---
  if (interaction.commandName === "ban-listesi") {
    try {
      const bans = await interaction.guild.bans.fetch(); //
      const embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setTitle("🔨 Yasaklar") //
        .setTimestamp();

      if (bans.size === 0) {
        embed.setDescription("Sunucuda aktif bir yasaklama bulunmuyor."); //
      } else {
        const list = bans.map(b => `👤 **${b.user.tag}**\n🆔 \`${b.user.id}\`\n📝 Sebep: ${b.reason || "Yok"}`).join("\n\n");
        embed.setDescription(list.length > 4000 ? list.substring(0, 3950) + "..." : list);
      }
      await interaction.channel.send({ embeds: [embed] });
    } catch { 
      console.log("Ban listesi hatası");
    }
  }

  // --- BAN KOMUTU ---
  if (interaction.commandName === "ban") {
    const target = interaction.options.getUser("kullanici");
    const reason = interaction.options.getString("sebep");
    try {
      await interaction.guild.members.ban(target.id, { reason });
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(`✅ **${target.tag}** yasaklandı.\n**Sebep:** ${reason}`)
        .setTimestamp();
      await interaction.channel.send({ embeds: [embed] });
    } catch {
      console.log("Ban hatası");
    }
  }

  // Komut sonrası o gizli "İşlem yapılıyor" yazısını siler, kanal tertemiz kalır
  await interaction.deleteReply();
});

client.login(process.env.TOKEN);
