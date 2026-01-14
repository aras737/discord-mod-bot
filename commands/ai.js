const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  Events,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits 
} = require("discord.js");
const { QuickDB } = require("quick.db");
require("dotenv").config();

// BigInt Çözümü
BigInt.prototype.toJSON = function() { return this.toString(); };

const db = new QuickDB();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

/* ================= AYARLAR ================= */
const BOT_TOKEN = process.env.TOKEN;
const BOT_OWNER_ID = "1389930042200559706"; // Kendi ID'n
const GUILD_ID = "SUNUCU_ID_BURAYA"; // Komutların ANINDA gelmesi için Sunucu ID'ni yaz
const YETKILI_ROLLER = ["Ordu Generalleri", "Ordu Yönetimi"];
/* =========================================== */

const hasAuth = (member) => 
  member.permissions.has(PermissionFlagsBits.Administrator) || 
  member.roles.cache.some(r => YETKILI_ROLLER.includes(r.name));

// --- KOMUT TANIMLARI ---
const commands = [
  new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Eğitim sistemi")
    .addSubcommand(s => s.setName("logs").setDescription("Log kanalı ayarla").addChannelOption(o => o.setName("kanal").setDescription("Kanal").setRequired(true)))
    .addSubcommand(s => s.setName("liste").setDescription("Puan bak").addStringOption(o => o.setName("isim").setDescription("Eğitmen adı").setRequired(true))),
  new SlashCommandBuilder().setName("yonetim-paneli").setDescription("Sahip paneli"),
  new SlashCommandBuilder().setName("rollerisil").setDescription("Hiyerarşindeki tüm rolleri siler")
].map(c => c.toJSON());

// --- BOT HAZIR OLDUĞUNDA ---
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ ${c.user.tag} girişi başarılı!`);
  
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    // Routes.applicationGuildCommands kullanarak komutları ANINDA sunucuya yüklüyoruz
    await rest.put(Routes.applicationGuildCommands(c.user.id, GUILD_ID), { body: commands });
    console.log("🚀 Komutlar sunucuya ANINDA yüklendi!");
  } catch (err) {
    console.error("❌ Komut yükleme hatası:", err);
  }
});

// --- MESAJ DİNLEME ---
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) return;

  const logId = await db.get(`egitim_${msg.guild.id}.kanal`);
  if (msg.channel.id === logId && hasAuth(msg.member)) {
    const egMatch = msg.content.match(/İsim:\s*(.*)/i);
    const alMatch = msg.content.match(/İsmi:\s*(.*)/i);
    const tagMatch = msg.content.match(/<@&(\d+)>/);

    if (egMatch && alMatch && tagMatch && msg.attachments.size > 0) {
      const egitmen = egMatch[1].trim();
      const embed = new EmbedBuilder()
        .setTitle("📩 Eğitim Onay Bekliyor")
        .addFields(
          { name: "👤 Eğitmen", value: egitmen, inline: true },
          { name: "👤 Alan", value: alMatch[1].trim(), inline: true },
          { name: "🏷️ Tag", value: `<@&${tagMatch[1]}>`, inline: true }
        )
        .setImage(msg.attachments.first().url)
        .setColor("Yellow");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("onay").setLabel("✅ Onayla").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("red").setLabel("❌ Reddet").setStyle(ButtonStyle.Danger)
      );

      await msg.reply({ embeds: [embed], components: [row] });
    }
  }
});

// --- ETKİLEŞİMLER ---
client.on(Events.InteractionCreate, async (i) => {
  if (i.isChatInputCommand()) {
    if (i.commandName === "egitim") {
      if (!hasAuth(i.member)) return i.reply({ content: "Yetkin yok!", ephemeral: true });
      if (i.options.getSubcommand() === "logs") {
        const chan = i.options.getChannel("kanal");
        await db.set(`egitim_${i.guild.id}.kanal`, chan.id);
        return i.reply(`✅ Log kanalı ${chan} yapıldı.`);
      }
      if (i.options.getSubcommand() === "liste") {
        const isim = i.options.getString("isim");
        const count = await db.get(`egitim_${i.guild.id}.sayac.${isim}`) || 0;
        return i.reply(`📊 **${isim}** toplam **${count}** eğitim vermiş.`);
      }
    }
    // Diğer komutları buraya ekleyebilirsin...
  }

  if (i.isButton()) {
    if (!hasAuth(i.member)) return i.reply({ content: "Yetkin yok!", ephemeral: true });
    
    const embed = i.message.embeds[0];
    const egitmen = embed.fields.find(f => f.name === "👤 Eğitmen").value;

    if (i.customId === "onay") {
      await db.add(`egitim_${i.guild.id}.sayac.${egitmen}`, 1);
      const ok = EmbedBuilder.from(embed).setTitle("✅ Onaylandı").setColor("Green");
      await i.update({ embeds: [ok], components: [] });
    }
    if (i.customId === "red") {
      const no = EmbedBuilder.from(embed).setTitle("❌ Reddedildi").setColor("Red");
      await i.update({ embeds: [no], components: [] });
    }
  }
});

client.login(BOT_TOKEN);
