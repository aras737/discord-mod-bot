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
const YETKILI_ROLLER = ["Ordu Generalleri", "Ordu Yönetimi"]; // Butonları kullanabilecek roller

// --- YETKİ KONTROLÜ ---
const isOwner = (userId) => userId === BOT_OWNER_ID;
const hasMilitaryAuth = (member) => 
  member.permissions.has(PermissionFlagsBits.Administrator) || 
  member.roles.cache.some(r => YETKILI_ROLLER.includes(r.name));

// ----------------------------------------------------------------------
// --- 1. SLASH KOMUTLARI ---
// ----------------------------------------------------------------------
const commands = [
  new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Ordu eğitim sistemi")
    .addSubcommand(s => s.setName("logs").setDescription("Log kanalını ayarla").addChannelOption(o => o.setName("kanal").setDescription("Kanal").setRequired(true)))
    .addSubcommand(s => s.setName("liste").setDescription("Puan sorgula").addStringOption(o => o.setName("isim").setDescription("Eğitmen adı").setRequired(true))),
  new SlashCommandBuilder().setName("yonetim-paneli").setDescription("Bot sahibi özel paneli"),
  new SlashCommandBuilder().setName("rollerisil").setDescription("Hiyerarşindeki rolleri siler")
].map(c => c.toJSON());

// ----------------------------------------------------------------------
// --- 2. ANA OLAYLAR ---
// ----------------------------------------------------------------------

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Ordu Botu Hazır: ${c.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
  } catch (err) { console.error(err); }
});

// MESAJ YAKALAYICI (Eğitim Formatı Kontrolü)
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
        .setTitle("📩 Yeni Eğitim Kaydı (Onay Bekliyor)")
        .setDescription("Lütfen bu kaydı kontrol edip onaylayın veya reddedin.")
        .addFields(
          { name: "👤 Eğitmen", value: egitmen, inline: true },
          { name: "👤 Alan", value: alan, inline: true },
          { name: "🏷️ Tag", value: `<@&${tag}>`, inline: true }
        )
        .setImage(ssUrl)
        .setColor("Yellow")
        .setFooter({ text: `Gönderen: ${msg.author.tag}` });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("onay_egitim").setLabel("✅ Onayla").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("red_egitim").setLabel("❌ Reddet").setStyle(ButtonStyle.Danger)
      );

      await msg.reply({ embeds: [embed], components: [buttons] });
    }
  }
});

// ETKİLEŞİM YAKALAYICI (Butonlar & Slash)
client.on(Events.InteractionCreate, async (interaction) => {
  const { guild, member, user, customId, message } = interaction;

  // --- BUTON İŞLEMLERİ ---
  if (interaction.isButton()) {
    // Sadece yetkililer butonlara basabilir
    if (!hasMilitaryAuth(member)) {
      return interaction.reply({ content: "❌ Bu butonları sadece **Ordu Yetkilileri** kullanabilir.", ephemeral: true });
    }

    // Embed'den bilgileri çek
    const embed = message.embeds[0];
    const egitmenAdi = embed.fields.find(f => f.name === "👤 Eğitmen").value;

    if (customId === "onay_egitim") {
      await db.add(`egitim_${guild.id}_sayac_${egitmenAdi}`, 1);

      const approvedEmbed = EmbedBuilder.from(embed)
        .setTitle("✅ Eğitim Kaydı Onaylandı")
        .setColor("Green")
        .setFooter({ text: `Onaylayan: ${user.tag}` });

      await interaction.update({ embeds: [approvedEmbed], components: [] });
    }

    if (customId === "red_egitim") {
      const rejectedEmbed = EmbedBuilder.from(embed)
        .setTitle("❌ Eğitim Kaydı Reddedildi")
        .setColor("Red")
        .setFooter({ text: `Reddeden: ${user.tag}` });

      await interaction.update({ embeds: [rejectedEmbed], components: [] });
    }
    
    if (customId === "p_restart" && isOwner(user.id)) {
        await interaction.reply({content: "Bot kapatılıyor...", ephemeral: true});
        process.exit();
    }
  }

  // --- SLASH KOMUTLARI ---
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;

    if (commandName === "egitim") {
      if (!hasMilitaryAuth(member)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
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
        return interaction.editReply(`${deleted} adet rol imha edildi.`);
    }
  }
});

client.login(BOT_TOKEN);
