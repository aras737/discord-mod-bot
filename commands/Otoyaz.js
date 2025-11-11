// ceza.js
// Railway / single-file uyumlu moderation sistemi.
// Kullanım: /ceza add @user <kategori> <sebep>
//        /ceza list
//        /ceza remove <id|@user>
//
// Gereksinimler: .env içinde DISCORD_TOKEN setli olmalı.
// Başlat: node ceza.js

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  PermissionFlagsBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (!TOKEN || TOKEN.length < 30) {
  console.error("DISCORD_TOKEN bulunamadı veya geçersiz. Railway env ayarlarını kontrol et.");
  process.exit(1);
}

const DATA_FILE = path.join(process.cwd(), "punishments.json");
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
  } catch (e) {
    console.error("Punishments yüklenirken hata:", e);
    return {};
  }
}
function saveData(obj) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch (e) {
    console.error("Punishments kaydedilirken hata:", e);
  }
}

// Basit ID üretici
function genId() {
  return Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const cezaCommand = new SlashCommandBuilder()
  .setName("ceza")
  .setDescription("Ceza sistemi: ekle, listele, sil")
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Bir kullanıcıya ceza ekle")
      .addUserOption((opt) => opt.setName("kullanici").setDescription("Ceza verilecek kullanıcı").setRequired(true))
      .addStringOption((opt) =>
        opt.setName("kategori").setDescription("Ceza kategorisi (ör. asayiş, küfür)").setRequired(true)
      )
      .addStringOption((opt) => opt.setName("sebep").setDescription("Ceza sebebi").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("Sunucudaki aktif cezaları listeler")
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Bir cezayı ID veya kullanıcı ile kaldır")
      .addStringOption((opt) => opt.setName("id").setDescription("Cezanın ID'si veya kullanıcı mention/ID").setRequired(true))
  );

// Komutları REST ile kaydet
client.once(Events.ClientReady, async () => {
  console.log(`Bot hazır: ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: [cezaCommand.toJSON()] });
    console.log("Slash komutu yüklendi: /ceza");
  } catch (err) {
    console.error("Komut kaydetme hatası:", err);
  }

  // 24 saatlik reminder döngüsü: sunucuda aktif cezalar varsa sunucu sahibi/ yetkiliye hatırlatma gönder
  setInterval(async () => {
    const data = loadData();
    const now = Date.now();
    for (const guildId of Object.keys(data)) {
      const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;
      const list = data[guildId].filter(p => p.active);
      if (!list || list.length === 0) continue;

      // Hedef: sunucu sahibi (owner) ve "ManageGuild" yetkisine sahip üyeler
      let recipients = [];
      try {
        await guild.fetch();
        const owner = await guild.fetchOwner().catch(() => null);
        if (owner) recipients.push(owner.user);
      } catch {}

      try {
        const members = await guild.members.fetch({ withPresences: false }).catch(() => null);
        if (members) {
          members.forEach(m => {
            if (m.permissions.has(PermissionFlagsBits.ManageGuild) || m.permissions.has(PermissionFlagsBits.Administrator) || m.permissions.has(PermissionFlagsBits.ManageRoles)) {
              if (!recipients.find(u => u.id === m.user.id)) recipients.push(m.user);
            }
          });
        }
      } catch (e) {}

      if (recipients.length === 0) continue;

      // Oluşturulma tarihinden beri kaç gün geçtiği bilgisi
      for (const to of recipients) {
        try {
          const summary = list.slice(0, 10).map(p => `ID:${p.id} • <@${p.userId}> • ${p.category} • ${p.reason} • Tarih: ${new Date(p.timestamp).toLocaleString()}`).join("\n");
          const more = list.length > 10 ? `\n...ve ${list.length - 10} daha` : "";
          await to.send({
            content: `🔔 [${guild.name}] Sunucuda aktif cezalar bulundu (toplam ${list.length}). İlk kayıttan beri ${Math.floor((now - list[0].timestamp) / (1000 * 60 * 60 * 24))} gün geçti.\n\n${summary}${more}\n\nEğer cezaların takibi yapılmadıysa /ceza list ile kontrol ederek /ceza remove <id> ile kaldırabilirsiniz.`
          }).catch(() => {});
        } catch (e) {
          // ignore
        }
      }
    }
  }, 24 * 60 * 60 * 1000); // 24h
});

// Interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "ceza") return;

  // Basit yetki kontrolü: komutu kullanacak kişi sunucu üzerinde ManageMessages veya Administrator olmalı
  const member = interaction.member;
  if (!member.permissions.has(PermissionFlagsBits.ManageMessages) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "❌ Bu komutu kullanmak için yeterli yetkiniz yok (Manage Messages veya Administrator gerekli).", ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  // Yükle/veri okuma
  const db = loadData();
  if (!db[interaction.guildId]) db[interaction.guildId] = [];

  if (sub === "add") {
    const target = interaction.options.getUser("kullanici", true);
    const category = interaction.options.getString("kategori", true);
    const reason = interaction.options.getString("sebep", true);

    const id = genId();
    const entry = {
      id,
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      category,
      reason,
      timestamp: Date.now(),
      active: true
    };
    db[interaction.guildId].push(entry);
    saveData(db);

    // Onay butonu: eğer moderation ekibi onay isterse kullanılabilir (opsiyonel)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ack_${id}`).setLabel("İşaretle: takip edildi").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: `✅ Ceza eklendi. ID: ${id}\nKullanıcı: <@${target.id}>\nKategori: ${category}\nSebep: ${reason}`,
      components: [row],
      ephemeral: true
    });
    return;
  }

  if (sub === "list") {
    const list = db[interaction.guildId].filter(p => p.active);
    if (!list || list.length === 0) {
      return interaction.reply({ content: "✅ Bu sunucuda aktif ceza bulunmuyor.", ephemeral: true });
    }

    // paginate mantığı basit: ilk 10 göster
    const lines = list.slice(0, 10).map(p => `ID:${p.id} • <@${p.userId}> • ${p.category} • ${p.reason} • <@${p.moderatorId}> • ${new Date(p.timestamp).toLocaleString()}`);
    const more = list.length > 10 ? `\n...ve ${list.length - 10} daha` : "";

    return interaction.reply({
      content: `📋 Aktif cezalar (${list.length}):\n\n${lines.join("\n")}${more}`,
      ephemeral: true
    });
  }

  if (sub === "remove") {
    const raw = interaction.options.getString("id", true).trim();

    // önce ID ile dene
    let removed = null;
    // eğer mention ise <@id> veya id verilen kullanıcıysa, kullanıcı bazlı kaldır
    const mentionMatch = raw.match(/^<@!?(\d+)>$/);
    const asId = mentionMatch ? mentionMatch[1] : raw;

    // Kaldırma mantığı: önce tam ID eşleşmesi, sonra userId eşleşmeleri (tümünü kapat)
    let arr = db[interaction.guildId];

    // ID eşleşmesi
    let idx = arr.findIndex(p => p.id === asId);
    if (idx !== -1) {
      removed = arr.splice(idx, 1)[0];
    } else {
      // userId eşleşmesi -> hepsini kaldır
      const userMatches = arr.filter(p => p.userId === asId);
      if (userMatches.length > 0) {
        // çıkar hepsini
        arr = arr.filter(p => p.userId !== asId);
        // set back
        db[interaction.guildId] = arr;
        saveData(db);
        return interaction.reply({ content: `✅ Kullanıcı <@${asId}> için ${userMatches.length} ceza kaldırıldı.`, ephemeral: true });
      }
    }

    if (removed) {
      saveData(db);
      return interaction.reply({ content: `✅ Ceza ID ${removed.id} kaldırıldı. (Kullanıcı: <@${removed.userId}>)`, ephemeral: true });
    }

    return interaction.reply({ content: "❌ Böyle bir ceza ID'si veya kullanıcı bulunamadı.", ephemeral: true });
  }
});

// Basit button ACK handler: takip edildi işareti (yalnızca komutu ekleyen veya moderasyon yetkisi olanlar)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  const custom = interaction.customId;
  if (!custom.startsWith("ack_")) return;

  const id = custom.split("_")[1];
  const db = loadData();
  const guildDb = db[interaction.guildId] || [];
  const entry = guildDb.find(p => p.id === id);
  if (!entry) {
    return interaction.reply({ content: "❌ Bu ceza bulunamadı (muhtemelen silinmiş).", ephemeral: true });
  }

  // Yetki kontrolü: ya ceza ekleyeni ya da ManageMessages yetkisi olan biri
  if (interaction.user.id !== entry.moderatorId && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "❌ Bu butona basma yetkiniz yok.", ephemeral: true });
  }

  // İşaretle: takip edildi (active kalır ama bir işaret bırak)
  entry.lastAck = Date.now();
  saveData(db);

  return interaction.reply({ content: `✅ Ceza ID ${id} için takip işareti bırakıldı.`, ephemeral: true });
});

// Giriş
client.login(TOKEN).catch(err => {
  console.error("Login hatası:", err);
  process.exit(1);
});
