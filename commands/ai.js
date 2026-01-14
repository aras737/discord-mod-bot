const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  Events,
  Collection,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits 
} = require("discord.js");
const { QuickDB } = require("quick.db");
require("dotenv").config();

// 🚨 BigInt Serileştirme Çözümü
BigInt.prototype.toJSON = function() { return this.toString(); };

const db = new QuickDB();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Channel]
});

// --- AYARLAR ---
const BOT_TOKEN = process.env.TOKEN;
const BOT_OWNER_ID = "1389930042200559706"; 
const YETKILI_ROLLER = ["Ordu Generalleri", "Ordu Yönetimi"];

// --- YETKİ KONTROLÜ ---
const isOwner = (userId) => userId === BOT_OWNER_ID;
const hasMilitaryAuth = (member) => 
  member.permissions.has(PermissionFlagsBits.Administrator) || 
  member.roles.cache.some(r => YETKILI_ROLLER.includes(r.name));

// ----------------------------------------------------------------------
// --- 1. SLASH KOMUTLARINI HAZIRLA ---
// ----------------------------------------------------------------------
const commands = [
  // EĞİTİM KOMUTU
  new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Eğitim sistemini yönetmenizi sağlar.")
    .addSubcommand(s => 
        s.setName("logs")
         .setDescription("Eğitimlerin atılacağı log kanalını belirler.")
         .addChannelOption(o => o.setName("kanal").setDescription("Kanalı seçin").setRequired(true))
    )
    .addSubcommand(s => 
        s.setName("liste")
         .setDescription("Bir eğitmenin toplam puanını gösterir.")
         .addStringOption(o => o.setName("isim").setDescription("Eğitmen adı").setRequired(true))
    ),

  // PANEL KOMUTU
  new SlashCommandBuilder()
    .setName("yonetim-paneli")
    .setDescription("Bot sahibine özel yönetim menüsü."),

  // SİLME KOMUTU
  new SlashCommandBuilder()
    .setName("rollerisil")
    .setDescription("Yetkinizin yettiği tüm rolleri temizler.")
].map(cmd => cmd.toJSON());

// ----------------------------------------------------------------------
// --- 2. BOT HAZIR VE KOMUT KAYIT ---
// ----------------------------------------------------------------------
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ ${c.user.tag} girişi başarılı!`);
  
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    console.log(`${commands.length} adet Slash komutu yükleniyor...`);
    
    // Global kayıt (Tüm sunucularda görünür, gelmesi 1 saati bulabilir)
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    
    console.log("🚀 Slash komutları başarıyla kaydedildi!");
  } catch (err) {
    console.error("❌ Komut yükleme hatası:", err);
  }
});

// ----------------------------------------------------------------------
// --- 3. MESAJLARI DİNLE (OTOMATİK FORMAT) ---
// ----------------------------------------------------------------------
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) return;

  const logChanId = await db.get(`egitim_${msg.guild.id}_kanal`);
  if (msg.channel.id === logChanId && hasMilitaryAuth(msg.member)) {
    const text = msg.content;
    const egMatch = text.match(/İsim:\s*(.*)/i);
    const alMatch = text.match(/İsmi:\s*(.*)/i);
    const tagMatch = text.match(/<@&(\d+)>/);

    if (egMatch && alMatch && tagMatch && msg.attachments.size > 0) {
      const egitmen = egMatch[1].trim();
      const alan = alMatch[1].trim();
      const tag = tagMatch[1];
      const ssUrl = msg.attachments.first().url;

      const embed = new EmbedBuilder()
        .setTitle("📩 Eğitim Kaydı (Onay Bekliyor)")
        .addFields(
          { name: "👤 Eğitmen", value: `\`${egitmen}\``, inline: true },
          { name: "👤 Alan", value: `\`${alan}\``, inline: true },
          { name: "🏷️ Tag", value: `<@&${tag}>`, inline: true }
        )
        .setImage(ssUrl)
        .setColor(0xF1C40F) // Sarı
        .setFooter({ text: `Gönderen: ${msg.author.tag}` });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("onay_egitim").setLabel("✅ Onayla").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("red_egitim").setLabel("❌ Reddet").setStyle(ButtonStyle.Danger)
      );

      await msg.reply({ embeds: [embed], components: [buttons] });
    }
  }
});

// ----------------------------------------------------------------------
// --- 4. KOMUT VE BUTON ÇALIŞTIRICI ---
// ----------------------------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  // --- SLASH KOMUTLARI ---
  if (interaction.isChatInputCommand()) {
    const { commandName, options, guild, member, user } = interaction;

    if (commandName === "egitim") {
      if (!hasMilitaryAuth(member)) return interaction.reply({ content: "❌ Yetkin yok!", ephemeral: true });
      
      const sub = options.getSubcommand();
      if (sub === "logs") {
        const chan = options.getChannel("kanal");
        await db.set(`egitim_${guild.id}_kanal`, chan.id);
        return interaction.reply({ content: `✅ Log kanalı ${chan} yapıldı.`, ephemeral: true });
      }
      
      if (sub === "liste") {
        const isim = options.getString("isim");
        const count = await db.get(`egitim_${guild.id}_sayac_${isim}`) || 0;
        return interaction.reply({ content: `📊 **${isim}** toplam **${count}** eğitim vermiş.`, ephemeral: true });
      }
    }

    if (commandName === "yonetim-paneli") {
      if (!isOwner(user.id)) return interaction.reply({ content: "Sadece bot sahibi!", ephemeral: true });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("p_restart").setLabel("Botu Kapat").setStyle(ButtonStyle.Danger)
      );
      return interaction.reply({ content: "🛠 Yönetim Paneli", components: [row], ephemeral: true });
    }

    if (commandName === "rollerisil") {
        if (!member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply("Yönetici olmalısın!");
        await interaction.deferReply({ephemeral:true});
        let deleted = 0;
        for (const role of guild.roles.cache.values()) {
          if (role.name !== "@everyone" && !role.managed && role.position < guild.members.me.roles.highest.position) {
            await role.delete().catch(() => null);
            deleted++;
          }
        }
        return interaction.editReply(`${deleted} adet rol silindi.`);
    }
  }

  // --- BUTONLAR ---
  if (interaction.isButton()) {
    if (!hasMilitaryAuth(interaction.member)) {
      return interaction.reply({ content: "❌ Yetkin yok.", ephemeral: true });
    }

    const embed = interaction.message.embeds[0];
    const egitmenAdi = embed.fields.find(f => f.name === "👤 Eğitmen").value.replace(/`/g, "");

    if (interaction.customId === "onay_egitim") {
      await db.add(`egitim_${interaction.guild.id}_sayac_${egitmenAdi}`, 1);
      const approved = EmbedBuilder.from(embed).setTitle("✅ Onaylandı").setColor("Green").setFooter({ text: `Onaylayan: ${interaction.user.tag}` });
      await interaction.update({ embeds: [approved], components: [] });
    }

    if (interaction.customId === "red_egitim") {
      const denied = EmbedBuilder.from(embed).setTitle("❌ Reddedildi").setColor("Red").setFooter({ text: `Reddeden: ${interaction.user.tag}` });
      await interaction.update({ embeds: [denied], components: [] });
    }

    if (interaction.customId === "p_restart" && isOwner(interaction.user.id)) {
      await interaction.reply({ content: "Bot kapanıyor...", ephemeral: true });
      process.exit();
    }
  }
});

client.login(BOT_TOKEN);
