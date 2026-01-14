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
const BOT_OWNER_ID = "1389930042200559706"; 
const YETKILI_ROLLER = ["Ordu Generalleri", "Ordu Yönetimi"];
/* =========================================== */

const hasAuth = (member) => 
  member.permissions.has(PermissionFlagsBits.Administrator) || 
  member.roles.cache.some(r => YETKILI_ROLLER.includes(r.name));

// --- SLASH KOMUT TANIMLARI ---
const commands = [
  new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Eğitim sistemi komutları")
    .addSubcommand(s => 
      s.setName("logs")
       .setDescription("Otomatik eğitim kayıt kanalını ayarlar")
       .addChannelOption(o => o.setName("kanal").setDescription("Log kanalı").setRequired(true))
    )
    .addSubcommand(s => 
      s.setName("liste")
       .setDescription("Bir eğitmenin toplam puanını gösterir")
       .addStringOption(o => o.setName("isim").setDescription("Eğitmen adı").setRequired(true))
    ),
  new SlashCommandBuilder().setName("yonetim-paneli").setDescription("Bot sahibine özel panel"),
  new SlashCommandBuilder().setName("rollerisil").setDescription("Botun yetkisinin yettiği tüm rolleri temizler")
].map(c => c.toJSON());

// --- BOT HAZIR VE KOMUT KAYIT ---
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ ${c.user.tag} Aktif!`);
  
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    console.log("Global Slash komutları kaydediliyor...");
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log("🚀 Komutlar başarıyla kaydedildi! (Görünmesi birkaç dakika sürebilir)");
  } catch (err) {
    console.error("❌ Komut yükleme hatası:", err);
  }
});

// --- OTOMATİK EĞİTİM FORMATI VE BUTONLAR ---
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) return;

  const logChanId = await db.get(`egitim_${msg.guild.id}.kanal`);
  if (msg.channel.id === logChanId && hasAuth(msg.member)) {
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
        .setDescription("Lütfen bu kaydı kontrol edip aşağıdan onaylayın.")
        .addFields(
          { name: "👤 Eğitmen", value: egitmen, inline: true },
          { name: "👤 Alan", value: alan, inline: true },
          { name: "🏷️ Tag", value: `<@&${tag}>`, inline: true }
        )
        .setImage(ssUrl)
        .setColor(0xF1C40F);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("onay_eg").setLabel("✅ Onayla").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("red_eg").setLabel("❌ Reddet").setStyle(ButtonStyle.Danger)
      );

      await msg.reply({ embeds: [embed], components: [row] });
    }
  }
});

// --- ETKİLEŞİM YAKALAYICI (SLASH & BUTON) ---
client.on(Events.InteractionCreate, async (i) => {
  // Slash Komutları
  if (i.isChatInputCommand()) {
    if (i.commandName === "egitim") {
      if (!hasAuth(i.member)) return i.reply({ content: "Yetkin yok!", ephemeral: true });
      const sub = i.options.getSubcommand();

      if (sub === "logs") {
        const chan = i.options.getChannel("kanal");
        await db.set(`egitim_${i.guild.id}.kanal`, chan.id);
        return i.reply({ content: `✅ Eğitim kayıt kanalı ${chan} olarak ayarlandı.`, ephemeral: true });
      }

      if (sub === "liste") {
        const isim = i.options.getString("isim");
        const count = await db.get(`egitim_${i.guild.id}.sayac.${isim}`) || 0;
        return i.reply({ content: `📊 **${isim}** toplam **${count}** eğitim vermiş.`, ephemeral: true });
      }
    }

    if (i.commandName === "yonetim-paneli" && i.user.id === BOT_OWNER_ID) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("restart").setLabel("Botu Kapat").setStyle(ButtonStyle.Danger)
        );
        return i.reply({ content: "🛠 Yönetim Paneli", components: [row], ephemeral: true });
    }

    if (i.commandName === "rollerisil") {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Yönetici olmalısın!");
        await i.deferReply({ ephemeral: true });
        let silinen = 0;
        for (const r of i.guild.roles.cache.values()) {
            if (r.name !== "@everyone" && !r.managed && r.position < i.guild.members.me.roles.highest.position) {
                await r.delete().catch(() => null);
                silinen++;
            }
        }
        return i.editReply(`${silinen} adet rol silindi.`);
    }
  }

  // Butonlar
  if (i.isButton()) {
    if (!hasAuth(i.member)) return i.reply({ content: "❌ Yetkin yok.", ephemeral: true });

    const embed = i.message.embeds[0];
    const egitmenAdi = embed.fields.find(f => f.name === "👤 Eğitmen").value;

    if (i.customId === "onay_eg") {
      await db.add(`egitim_${i.guild.id}.sayac.${egitmenAdi}`, 1);
      const ok = EmbedBuilder.from(embed).setTitle("✅ Eğitim Onaylandı").setColor("Green").setFooter({ text: `Onaylayan: ${i.user.tag}` });
      await i.update({ embeds: [ok], components: [] });
    }

    if (i.customId === "red_eg") {
      const red = EmbedBuilder.from(embed).setTitle("❌ Eğitim Reddedildi").setColor("Red").setFooter({ text: `Reddeden: ${i.user.tag}` });
      await i.update({ embeds: [red], components: [] });
    }

    if (i.customId === "restart" && i.user.id === BOT_OWNER_ID) {
        await i.reply({ content: "Kapatılıyor...", ephemeral: true });
        process.exit();
    }
  }
});

client.login(BOT_TOKEN);
