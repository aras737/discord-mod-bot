// commands/modpanel.js
// Tam çalışan, gerçek koruma + panel + log + rollback (tek dosya).
// Gereksinimler: discord.js v14, quick.db (QuickDB)
// Kurulum:
// 1) Bu dosyayı commands/modpanel.js içine koy.
// 2) index.js içinde komutları yükle ve client.once('ready', ... ) içinde:
//    const modpanel = require('./commands/modpanel');
//    if (modpanel && typeof modpanel.initEvents === 'function') modpanel.initEvents(client);
// 3) npm i discord.js quick.db
// 4) Bot için izinler: ManageRoles, ManageChannels, BanMembers, ViewAuditLog, ModerateMembers, SendMessages, EmbedLinks
// Thumbnail / yerel görsel (opsiyonel): "/mnt/data/89391D-F7F9-407F-A4F6-B5A24052F76C.jpeg"

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  AuditLogEvent,
  Events
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

const fs = require("fs");
const path = require("path");
const BACKUP_DIR = path.join(process.cwd(), "modpanel_backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Default configuration
const DEFAULTS = {
  protectionEnabled: false,
  logChannelId: null,
  adminRoleId: null,
  whitelist: [],
  thresholds: {
    channelDeleteWindowMs: 60_000,
    channelDeleteLimit: 3,
    roleDeleteWindowMs: 60_000,
    roleDeleteLimit: 3,
    banWindowMs: 60_000,
    banLimit: 3
  },
  autoPunish: {
    channelDelete: "ban", // ban | timeout | removeroles | none
    roleDelete: "ban",
    massBan: "ban",
    botAdd: "ban",
    dangerousPermGrant: "removeroles"
  }
};

// Simple rollback snapshot functions (store JSON files per entity)
function saveChannelSnapshot(channel) {
  try {
    const data = {
      id: channel.id,
      guildId: channel.guild.id,
      name: channel.name,
      type: channel.type,
      parentId: channel.parentId || null,
      position: channel.position,
      topic: channel.topic || null,
      nsfw: channel.nsfw || false,
      rateLimitPerUser: channel.rateLimitPerUser || 0,
      createdAt: Date.now()
    };
    fs.writeFileSync(path.join(BACKUP_DIR, `channel_${channel.guild.id}_${channel.id}.json`), JSON.stringify(data, null, 2));
  } catch (e) { console.error("saveChannelSnapshot error", e); }
}

function saveRoleSnapshot(role) {
  try {
    const data = {
      id: role.id,
      guildId: role.guild.id,
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      permissions: role.permissions.bitfield,
      mentionable: role.mentionable,
      position: role.position,
      createdAt: Date.now()
    };
    fs.writeFileSync(path.join(BACKUP_DIR, `role_${role.guild.id}_${role.id}.json`), JSON.stringify(data, null, 2));
  } catch (e) { console.error("saveRoleSnapshot error", e); }
}

async function restoreChannels(guild) {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(`channel_${guild.id}_`));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, file)));
      // avoid duplicates by name
      if (guild.channels.cache.find(c => c.name === data.name)) continue;
      await guild.channels.create({
        name: data.name,
        type: data.type,
        topic: data.topic || undefined,
        nsfw: data.nsfw || false,
        rateLimitPerUser: data.rateLimitPerUser || 0,
        parent: data.parentId || null,
        position: data.position || undefined
      }).catch(()=>{});
    }
  } catch (e) { console.error("restoreChannels error", e); }
}

async function restoreRoles(guild) {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(`role_${guild.id}_`));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, file)));
      if (guild.roles.cache.find(r => r.name === data.name)) continue;
      await guild.roles.create({
        name: data.name,
        color: data.color || undefined,
        hoist: data.hoist || false,
        permissions: data.permissions || undefined,
        mentionable: data.mentionable || false,
        position: data.position || undefined
      }).catch(()=>{});
    }
  } catch (e) { console.error("restoreRoles error", e); }
}

// in-memory counters for rate detection
const counters = new Map();
function pushAction(guildId, type, userId, windowMs) {
  const key = `${guildId}:${type}:${userId}`;
  const now = Date.now();
  if (!counters.has(key)) counters.set(key, []);
  const arr = counters.get(key);
  arr.push(now);
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  counters.set(key, arr);
  return arr.length;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of counters) {
    if (!arr.length || now - arr[arr.length - 1] > 10 * 60_000) counters.delete(k);
  }
}, 60_000);

// Quick helpers
async function getCfg(guildId) {
  const raw = await db.get(`modpanel_cfg_${guildId}`) || {};
  return { ...DEFAULTS, ...raw, thresholds: { ...DEFAULTS.thresholds, ...(raw.thresholds||{}) }, autoPunish: { ...DEFAULTS.autoPunish, ...(raw.autoPunish||{}) } };
}
async function setCfg(guildId, cfg) {
  await db.set(`modpanel_cfg_${guildId}`, cfg);
}
async function getLogChannel(guild) {
  const cfg = await getCfg(guild.id);
  if (cfg.logChannelId) return guild.channels.cache.get(cfg.logChannelId) || await guild.channels.fetch(cfg.logChannelId).catch(()=>null);
  return guild.systemChannel || null;
}
async function isExempt(member) {
  if (!member) return false;
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions?.has && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const cfg = await getCfg(member.guild.id);
  if (cfg.adminRoleId && member.roles.cache.has(cfg.adminRoleId)) return true;
  if ((cfg.whitelist||[]).includes(member.id)) return true;
  return false;
}
async function applyPunish(guild, id, kind, reason) {
  try {
    const member = await guild.members.fetch(id).catch(()=>null);
    if (!member) return { ok:false, error:"notfound" };
    if (await isExempt(member)) return { ok:false, error:"exempt" };
    if (kind === "ban") { await guild.members.ban(id, { reason }).catch(()=>{}); return { ok:true, action:"ban" }; }
    if (kind === "timeout") { await member.timeout(15*60*1000, reason).catch(()=>{}); return { ok:true, action:"timeout" }; }
    if (kind === "removeroles") {
      const roles = member.roles.cache.filter(r => r.id !== guild.id).map(r=>r.id);
      if (roles.length) await member.roles.remove(roles).catch(()=>{});
      return { ok:true, action:"removeroles" };
    }
    return { ok:false, error:"unknown" };
  } catch (e) { return { ok:false, error:String(e) }; }
}

// audit-safe fetcher (tries a few times)
async function fetchExecutorSafe(guild, type, targetId=null) {
  for (let i=0;i<4;i++) {
    const logs = await guild.fetchAuditLogs({ type, limit: 5 }).catch(()=>null);
    if (!logs) { await new Promise(r=>setTimeout(r, 250)); continue; }
    let entry = null;
    if (targetId) entry = logs.entries.find(e => String(e.targetId) === String(targetId)) || logs.entries.first();
    else entry = logs.entries.first();
    if (entry && entry.executor) return entry.executor;
    await new Promise(r=>setTimeout(r, 250));
  }
  return null;
}

// Build panel UI
function buildPanelEmbed(cfg) {
  return new EmbedBuilder()
    .setTitle("🛡 Moderasyon Paneli — Gerçek Koruma")
    .setDescription(`Koruma: **${cfg.protectionEnabled ? "Açık ✅" : "Kapalı ❌"}**\nLog kanalını, admin rolünü ve hassas ayarları yönetebilirsiniz.`)
    .setColor(cfg.protectionEnabled ? 0x00ff88 : 0xff4444)
    .addFields(
      { name: "Log Kanalı", value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : "Ayarlı değil", inline: true },
      { name: "Admin Rolü (bypass)", value: cfg.adminRoleId ? `<@&${cfg.adminRoleId}>` : "Ayarlı değil", inline: true },
      { name: "Not", value: "Gerçek koruma: kanal/rol silme, bot ekleme, tehlikeli yetki denemelerine karşı otomatik aksiyon alır.", inline: false }
    )
    .setTimestamp();
}

function buildControlRows(cfg) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`toggle_protect`).setLabel(cfg.protectionEnabled ? "Koruma Kapat" : "Koruma Aç").setStyle(cfg.protectionEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId("lock_server").setLabel("Sunucuyu Kilitle").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("unlock_server").setLabel("Kilidi Aç").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("restore_all").setLabel("Restore (Roller+Kanallar)").setStyle(ButtonStyle.Primary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId("quick_mod").setPlaceholder("Hızlı moderasyon").addOptions([
      { label: "Toplu Kick", value: "mass_kick", description: "ID ile kick" },
      { label: "Toplu Ban", value: "mass_ban", description: "ID ile ban" },
      { label: "Toplu Timeout", value: "mass_timeout", description: "ID ile timeout" }
    ])
  );
  return [row1, row2];
}

// Export command
module.exports = {
  data: new SlashCommandBuilder()
    .setName("modpanel")
    .setDescription("Gerçek moderasyon paneli ve koruma sistemi.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt => opt.setName("log").setDescription("Log kanalı ayarla"))
    .addRoleOption(opt => opt.setName("adminrole").setDescription("Koruma bypass rolü ayarla")),

  async execute(interaction) {
    const guild = interaction.guild;
    const logCh = interaction.options.getChannel("log");
    const adminRole = interaction.options.getRole("adminrole");

    const cfgRaw = await db.get(`modpanel_cfg_${guild.id}`) || {};
    const cfg = { ...DEFAULTS, ...cfgRaw, thresholds: { ...DEFAULTS.thresholds, ...(cfgRaw.thresholds||{}) }, autoPunish: { ...DEFAULTS.autoPunish, ...(cfgRaw.autoPunish||{}) } };

    if (logCh) cfg.logChannelId = logCh.id;
    if (adminRole) cfg.adminRoleId = adminRole.id;

    await setCfg(guild.id, cfg);

    const embed = buildPanelEmbed(cfg);
    const rows = buildControlRows(cfg);

    const message = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });

    // Collectors
    const btnCollector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60*60*1000 });
    btnCollector.on("collect", async btn => {
      await btn.deferReply({ ephemeral: true });
      const member = await guild.members.fetch(btn.user.id).catch(()=>null);
      if (!member) return btn.editReply({ content: "Üye bulunamadı.", ephemeral: true });

      if (! (member.permissions.has(PermissionFlagsBits.Administrator) || (cfg.adminRoleId && member.roles.cache.has(cfg.adminRoleId)) ) ) {
        return btn.editReply({ content: "Bu paneli kullanmak için yetkiniz yok.", ephemeral: true });
      }

      if (btn.customId === "toggle_protect") {
        cfg.protectionEnabled = !cfg.protectionEnabled;
        await setCfg(guild.id, cfg);
        await btn.editReply({ content: `Koruma ${cfg.protectionEnabled ? "AÇILDI ✅" : "KAPANDI ❌"}`, ephemeral: true });
        // update panel
        const newEmbed = buildPanelEmbed(cfg);
        const newRows = buildControlRows(cfg);
        await message.edit({ embeds: [newEmbed], components: newRows }).catch(()=>{});
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("⚙️ Koruma Durumu Değişti").setDescription(`Yetkili: ${btn.user.tag}\nDurum: ${cfg.protectionEnabled ? "Açıldı" : "Kapalı"}`).setColor(cfg.protectionEnabled ? 0x00ff88 : 0xff4444).setTimestamp() ] }).catch(()=>{});
        return;
      }

      if (btn.customId === "lock_server") {
        await db.set(`modpanel_cfg_${guild.id}.panic`, true).catch(()=>{});
        try { await guild.setVerificationLevel(4); } catch {}
        await btn.editReply({ content: "Sunucu kilitlendi.", ephemeral: true });
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🔐 Sunucu Kilitlendi").setDescription(`Yetkili: ${btn.user.tag}`).setColor(0xff8800).setTimestamp() ] }).catch(()=>{});
        return;
      }

      if (btn.customId === "unlock_server") {
        await db.set(`modpanel_cfg_${guild.id}.panic`, false).catch(()=>{});
        try { await guild.setVerificationLevel(1); } catch {}
        await btn.editReply({ content: "Sunucu kilidi kaldırıldı.", ephemeral: true });
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🔓 Sunucu Kilidi Kaldırıldı").setDescription(`Yetkili: ${btn.user.tag}`).setColor(0x00cc88).setTimestamp() ] }).catch(()=>{});
        return;
      }

      if (btn.customId === "restore_all") {
        await btn.editReply({ content: "Restore işlemi başlatıldı. Roller ve kanallar yeniden oluşturuluyor (varsa yedekten).", ephemeral: true });
        await restoreRoles(guild).catch(()=>{});
        await restoreChannels(guild).catch(()=>{});
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🔁 Restore Başlatıldı").setDescription(`Yetkili: ${btn.user.tag}`).setColor(0x3399ff).setTimestamp() ] }).catch(()=>{});
        return;
      }

      return btn.editReply({ content: "Bilinmeyen buton.", ephemeral: true });
    });

    const selectCollector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60*60*1000 });
    selectCollector.on("collect", async sel => {
      await sel.deferReply({ ephemeral: true });
      const member = await guild.members.fetch(sel.user.id).catch(()=>null);
      if (!member) return sel.editReply({ content: "Üye bulunamadı.", ephemeral: true });
      if (! (member.permissions.has(PermissionFlagsBits.Administrator) || (cfg.adminRoleId && member.roles.cache.has(cfg.adminRoleId)) ) ) {
        return sel.editReply({ content: "Bu paneli kullanmak için yetkiniz yok.", ephemeral: true });
      }

      const choice = sel.values[0];
      sel.editReply({ content: "Hedef kullanıcı ID'lerini virgül ile içeren bir mesaj gönderin (ör: `123,456,789`).", ephemeral: true });

      const mc = sel.channel.createMessageCollector({ filter: m => m.author.id === sel.user.id, max: 1, time: 30_000 });
      mc.on("collect", async m => {
        const ids = m.content.split(",").map(s => s.trim()).filter(Boolean);
        const performed = [];
        for (const id of ids) {
          const memberTarget = await guild.members.fetch(id).catch(()=>null);
          if (!memberTarget) continue;
          try {
            if (choice === "mass_kick") { await memberTarget.kick(`Mass action by ${sel.user.tag}`).catch(()=>{}); performed.push(`Kick → ${memberTarget.user.tag}`); }
            if (choice === "mass_ban") { await guild.members.ban(id, { reason: `Mass action by ${sel.user.tag}` }).catch(()=>{}); performed.push(`Ban → ${memberTarget.user.tag}`); }
            if (choice === "mass_timeout") { await memberTarget.timeout(15*60*1000, `Mass action by ${sel.user.tag}`).catch(()=>{}); performed.push(`Timeout → ${memberTarget.user.tag}`); }
          } catch (e) { console.error("mass action error", e); }
        }
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("📝 Toplu Moderasyon").setDescription(`Yetkili: ${sel.user.tag}\nİşlem: ${choice}\nHedef sayısı: ${performed.length}`).addFields({ name: "Detay", value: performed.join("\n") }).setColor(0x0066ff).setTimestamp() ] }).catch(()=>{});
        sel.followUp({ content: `İşlem tamamlandı: ${performed.length} hedef`, ephemeral: true });
      });

      mc.on("end", collected => {
        if (collected.size === 0) sel.followUp({ content: "Süre doldu, işlem iptal edildi.", ephemeral: true });
      });
    });
  },

  // initEvents: attach real protection listeners (call once after client login)
  initEvents: async (client) => {
    // Channel delete protection
    client.on(Events.ChannelDelete, async (channel) => {
      try {
        const guild = channel.guild;
        const cfg = await getCfg(guild.id);
        if (!cfg.protectionEnabled) return;
        // save snapshot before anything (best effort)
        try { saveChannelSnapshot(channel); } catch {}
        const executor = await fetchExecutorSafe(guild, AuditLogEvent.ChannelDelete, channel.id);
        if (!executor || executor.id === client.user.id) return;
        const member = await guild.members.fetch(executor.id).catch(()=>null);
        if (!member) return;
        if (await isExempt(member)) return;
        const count = pushAction(guild.id, "channelDelete", executor.id, cfg.thresholds.channelDeleteWindowMs);
        const limit = cfg.thresholds.channelDeleteLimit;
        const kind = cfg.autoPunish.channelDelete || "ban";
        let res = { ok:false };
        if (count >= limit) res = await applyPunish(guild, executor.id, kind, "Mass channel delete - protection");
        else res = await applyPunish(guild, executor.id, "removeroles", "Suspicious channel delete");
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🔥 Kanal Silme Tespit Edildi").setDescription(`Kanal: **${channel.name}**\nFail: <@${executor.id}> (${executor.tag})`).addFields({ name:"Eylem", value: res.ok ? res.action : "uygulama başarısız" }, { name:"Sayaç", value: `${count}/${limit}` }).setColor(0xff0000).setTimestamp() ] }).catch(()=>{});
        // attempt restore after small delay
        setTimeout(()=> restoreChannels(guild).catch(()=>{}), 2000);
      } catch (e) { console.error("ChannelDelete handler error", e); }
    });

    // Role delete protection
    client.on(Events.GuildRoleDelete, async (role) => {
      try {
        const guild = role.guild;
        const cfg = await getCfg(guild.id);
        if (!cfg.protectionEnabled) return;
        try { saveRoleSnapshot(role); } catch {}
        const executor = await fetchExecutorSafe(guild, AuditLogEvent.RoleDelete, role.id);
        if (!executor || executor.id === client.user.id) return;
        const member = await guild.members.fetch(executor.id).catch(()=>null);
        if (!member) return;
        if (await isExempt(member)) return;
        const count = pushAction(guild.id, "roleDelete", executor.id, cfg.thresholds.roleDeleteWindowMs);
        const limit = cfg.thresholds.roleDeleteLimit;
        const kind = cfg.autoPunish.roleDelete || "ban";
        let res = { ok:false };
        if (count >= limit) res = await applyPunish(guild, executor.id, kind, "Mass role delete - protection");
        else res = await applyPunish(guild, executor.id, "removeroles", "Suspicious role delete");
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🔥 Rol Silme Tespit Edildi").setDescription(`Rol: **${role.name}**\nFail: <@${executor.id}> (${executor.tag})`).addFields({ name:"Eylem", value: res.ok ? res.action : "uygulama başarısız" }, { name:"Sayaç", value: `${count}/${limit}` }).setColor(0xff0000).setTimestamp() ] }).catch(()=>{});
        setTimeout(()=> restoreRoles(guild).catch(()=>{}), 2000);
      } catch (e) { console.error("RoleDelete handler error", e); }
    });

    // Role update dangerous perms
    client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
      try {
        const guild = newRole.guild;
        const cfg = await getCfg(guild.id);
        if (!cfg.protectionEnabled) return;
        const dangerous = [ PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.BanMembers ];
        for (const p of dangerous) {
          if (!oldRole.permissions.has(p) && newRole.permissions.has(p)) {
            const executor = await fetchExecutorSafe(guild, AuditLogEvent.RoleUpdate);
            if (!executor || executor.id === client.user.id) return;
            const member = await guild.members.fetch(executor.id).catch(()=>null);
            if (!member) return;
            if (await isExempt(member)) return;
            // revert perms
            await newRole.setPermissions(oldRole.permissions).catch(()=>{});
            const kind = cfg.autoPunish.dangerousPermGrant || "removeroles";
            const res = await applyPunish(guild, executor.id, kind, "Unauthorized permission grant");
            const log = await getLogChannel(guild);
            if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🔱 Tehlikeli Yetki Denemesi Engellendi").setDescription(`Rol: **${newRole.name}**\nFail: <@${executor.id}> (${executor.tag})`).addFields({ name:"Eylem", value: res.ok ? res.action : "uygulama başarısız" }).setColor(0x990000).setTimestamp() ] }).catch(()=>{});
            return;
          }
        }
      } catch (e) { console.error("RoleUpdate handler error", e); }
    });

    // Bot add protection
    client.on(Events.GuildMemberAdd, async (member) => {
      try {
        const guild = member.guild;
        const cfg = await getCfg(guild.id);
        if (!cfg.protectionEnabled) return;
        if (!member.user.bot) return;
        const audit = await guild.fetchAuditLogs({ limit: 6 }).catch(()=>null);
        const entry = audit?.entries.find(e => e.targetId === member.user.id && e.action === AuditLogEvent.BotAdd);
        const executor = entry?.executor;
        if (!executor || executor.id === client.user.id) return;
        const execMember = await guild.members.fetch(executor.id).catch(()=>null);
        if (!execMember) return;
        if (await isExempt(execMember)) return;
        const kind = cfg.autoPunish.botAdd || "ban";
        const res = await applyPunish(guild, executor.id, kind, "Unauthorized bot add");
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🤖 İzinsiz Bot Ekleme Tespit Edildi").setDescription(`Bot: <@${member.user.id}>\nEkleyen: <@${executor.id}> (${executor.tag})`).addFields({ name:"Eylem", value: res.ok ? res.action : "uygulama başarısız" }).setColor(0x990000).setTimestamp() ] }).catch(()=>{});
        // ban the added bot as well if possible
        await guild.members.ban(member.user.id, { reason: "Unauthorized bot" }).catch(()=>{});
      } catch (e) { console.error("GuildMemberAdd(bot) handler error", e); }
    });

    // Mass ban detection
    client.on(Events.GuildBanAdd, async (guildOrGuild, user) => {
      try {
        const guild = guildOrGuild && guildOrGuild.id ? guildOrGuild : null;
        if (!guild) return;
        const cfg = await getCfg(guild.id);
        if (!cfg.protectionEnabled) return;
        const entry = (await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 }).catch(()=>null))?.entries.first();
        if (!entry) return;
        const executor = entry.executor;
        if (!executor || executor.id === client.user.id) return;
        const member = await guild.members.fetch(executor.id).catch(()=>null);
        if (!member) return;
        if (await isExempt(member)) return;
        const count = pushAction(guild.id, "massBan", executor.id, cfg.thresholds.banWindowMs);
        const limit = cfg.thresholds.banLimit;
        const kind = cfg.autoPunish.massBan || "ban";
        let res = { ok:false };
        if (count >= limit) res = await applyPunish(guild, executor.id, kind, "Mass ban - protection");
        else res = await applyPunish(guild, executor.id, "timeout", "Suspicious ban activity");
        const log = await getLogChannel(guild);
        if (log) log.send({ embeds: [ new EmbedBuilder().setTitle("🚨 Toplu Ban Tespit Edildi").setDescription(`Fail: <@${executor.id}> (${executor.tag})\nHedef: ${user.tag || user.id}`).addFields({ name:"Eylem", value: res.ok ? res.action : "uygulama başarısız" }, { name:"Sayaç", value: `${count}/${limit}` }).setColor(0x8b0000).setTimestamp() ] }).catch(()=>{});
      } catch (e) { console.error("GuildBanAdd handler error", e); }
    });

    console.log("[MODPANEL] protection listeners initialized.");
  }
};
