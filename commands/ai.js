const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  Collection,
  PermissionFlagsBits 
} = require("discord.js");
const { QuickDB } = require("quick.db");
require("dotenv").config();

// 🚨 KRİTİK: BigInt Serileştirme Hatası Çözümü
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

// --- AYARLAR ---
const BOT_TOKEN = process.env.TOKEN;
const CLIENT_ID = "BOT_ID_YAZIN"; // Botunun ID'sini buraya gir

// Yetkili Rol İsimleri (Bu isimlere sahip herkes sistemi kullanabilir)
const YETKILI_ROLLER = ["Ordu Generalleri", "Ordu Yönetimi"];

// Yetki Kontrol Fonksiyonu
function yetkiKontrol(member) {
  // Yönetici ise veya belirlenen rollerden birine sahipse true döner
  return member.permissions.has(PermissionFlagsBits.Administrator) || 
         member.roles.cache.some(role => YETKILI_ROLLER.includes(role.name));
}

// ----------------------------------------------------------------------
// --- 1. SLASH KOMUT TANIMLARI ---
// ----------------------------------------------------------------------
const egitimKomutu = new SlashCommandBuilder()
  .setName("egitim")
  .setDescription("Eğitim sistemi yönetimi")
  .addSubcommand(sub =>
    sub.setName("logs").setDescription("Otomatik kayıt kanalını ayarla (Ordu Yönetimi)").addChannelOption(opt => opt.setName("kanal").setDescription("Kanal seçin").setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName("liste").setDescription("Eğitmen puanını gösterir").addStringOption(opt => opt.setName("isim").setDescription("Eğitmen adı").setRequired(true))
  );

const commands = [egitimKomutu.toJSON()];

// ----------------------------------------------------------------------
// --- 2. OTOMATİK KAYIT MANTIĞI (MESSAGE CREATE) ---
// ----------------------------------------------------------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const logChannelId = await db.get(`egitim_${guildId}_kanal`);

  // Sadece ayarlanan log kanalında çalış
  if (message.channel.id !== logChannelId) return;

  // YETKİ KONTROLÜ: Mesajı atan kişi General veya Ordu Yönetimi mi?
  if (!yetkiKontrol(message.member)) return;

  const text = message.content;
  
  // Regex Kontrolü
  const egitmenMatch = text.match(/İsim:\s*(.*)/i);
  const alanMatch = text.match(/İsmi:\s*(.*)/i);
  const tagMatch = text.match(/<@&(\d+)>/);

  if (egitmenMatch && alanMatch && tagMatch && message.attachments.size > 0) {
    const egitmenAdi = egitmenMatch[1].trim();
    const alanAdi = alanMatch[1].trim();
    const ssUrl = message.attachments.first().url;

    try {
      await db.add(`egitim_${guildId}_sayac_${egitmenAdi}`, 1);

      const logEmbed = new EmbedBuilder()
        .setTitle("🎖️ Ordu Eğitim Kaydı Onaylandı")
        .setDescription(`Kayıt, Ordu yetkilisi tarafından sisteme işlendi.`)
        .addFields(
          { name: "👤 Eğitmen (Yetkili)", value: `\`${egitmenAdi}\``, inline: true },
          { name: "👤 Eğitim Alan", value: `\`${alanAdi}\``, inline: true },
          { name: "🏷️ Rütbe/Tag", value: `<@&${tagMatch[1]}>`, inline: true }
        )
        .setImage(ssUrl)
        .setColor(0x1a472a) // Askeri yeşil tonu
        .setFooter({ text: `Kayıt İşlemi: ${message.author.tag}` })
        .setTimestamp();

      await message.reply({ embeds: [logEmbed] });
      await message.react("✅");

    } catch (error) {
      console.error("Kayıt Hatası:", error);
    }
  }
});

// ----------------------------------------------------------------------
// --- 3. SLASH KOMUT ÇALIŞTIRICI ---
// ----------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "egitim") {
    // Yetki Kontrolü
    if (!yetkiKontrol(interaction.member)) {
      return interaction.reply({ content: "❌ Bu komutu sadece **Ordu Generalleri** ve **Ordu Yönetimi** kullanabilir.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "logs") {
      const kanal = interaction.options.getChannel("kanal");
      await db.set(`egitim_${guildId}_kanal`, kanal.id);
      return interaction.reply({ content: `✅ Eğitim kayıt kanalı ${kanal} olarak ayarlandı.`, ephemeral: true });
    }

    if (sub === "liste") {
      const isim = interaction.options.getString("isim");
      const count = (await db.get(`egitim_${guildId}_sayac_${isim}`)) || 0;
      
      const listEmbed = new EmbedBuilder()
        .setTitle("📊 Ordu Eğitim İstatistiği")
        .setDescription(`**${isim}** için sistemde kayıtlı toplam eğitim: \`${count}\``)
        .setColor(0xd4af37) // Altın rengi
        .setTimestamp();

      return interaction.reply({ embeds: [listEmbed], ephemeral: true });
    }
  }
});

// ----------------------------------------------------------------------
// --- 4. BOT BAŞLATMA ---
// ----------------------------------------------------------------------
client.once("ready", async () => {
  console.log(`🎖️ ${client.user.tag} Ordu Komutanlığı emrinde aktif!`);
  
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Komutlar yüklendi.");
  } catch (error) { console.error(error); }
});

client.login(BOT_TOKEN);
