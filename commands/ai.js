const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  Events,
  PermissionFlagsBits 
} = require("discord.js");
const { QuickDB } = require("quick.db");
require("dotenv").config();

// 🚨 BigInt Serileştirme Hatası Çözümü
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
const YETKILI_ROLLER = ["Ordu Generalleri", "Ordu Yönetimi"];

// Yetki Kontrol Fonksiyonu
function yetkiKontrol(member) {
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
    sub.setName("logs").setDescription("Otomatik kayıt kanalını ayarla").addChannelOption(opt => opt.setName("kanal").setDescription("Kanal seçin").setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName("liste").setDescription("Eğitmen puanını gösterir").addStringOption(opt => opt.setName("isim").setDescription("Eğitmen adı").setRequired(true))
  );

const commands = [egitimKomutu.toJSON()];

// ----------------------------------------------------------------------
// --- 2. OTOMATİK KAYIT MANTIĞI ---
// ----------------------------------------------------------------------
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const logChannelId = await db.get(`egitim_${guildId}_kanal`);

  if (message.channel.id !== logChannelId) return;
  if (!yetkiKontrol(message.member)) return;

  const text = message.content;
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
        .addFields(
          { name: "👤 Eğitmen", value: `\`${egitmenAdi}\``, inline: true },
          { name: "👤 Alan", value: `\`${alanAdi}\``, inline: true },
          { name: "🏷️ Tag", value: `<@&${tagMatch[1]}>`, inline: true }
        )
        .setImage(ssUrl)
        .setColor(0x1a472a)
        .setFooter({ text: `Kayıt İşlemi: ${message.author.tag}` })
        .setTimestamp();

      await message.reply({ embeds: [logEmbed] });
      await message.react("✅");
    } catch (error) { console.error("Kayıt Hatası:", error); }
  }
});

// ----------------------------------------------------------------------
// --- 3. SLASH KOMUT ÇALIŞTIRICI ---
// ----------------------------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "egitim") {
    if (!yetkiKontrol(interaction.member)) {
      return interaction.reply({ content: "❌ Yetkiniz yetersiz.", ephemeral: true });
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
      return interaction.reply({ content: `📊 **${isim}** toplam **${count}** eğitim vermiş.`, ephemeral: true });
    }
  }
});

// ----------------------------------------------------------------------
// --- 4. BOT BAŞLATMA (HATALARIN DÜZELTİLDİĞİ KISIM) ---
// ----------------------------------------------------------------------
client.once(Events.ClientReady, async (c) => {
  console.log(`🎖️ ${c.user.tag} Ordu Komutanlığı emrinde aktif!`);
  
  // REST için bot ID'sini elinle yazmana gerek kalmadan c.user.id ile alıyoruz
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    console.log("Slash komutları güncelleniyor...");
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log("✅ Komutlar başarıyla yüklendi.");
  } catch (error) {
    console.error("Komut yükleme hatası:", error);
  }
});

client.login(BOT_TOKEN);
