// commands/antiguard.js
// All-in-one hardened Anti-Nuke / Anti-Abuse system
// Requires: discord.js v14, quick.db (QuickDB)
// Place in commands folder and call .init(client) after login.

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AuditLogEvent,
  Events
} = require("discord.js");
const { QuickDB } = require("quick.db");
const fs = require("fs");
const path = require("path");

const db = new QuickDB();

// Rollback store file (durable)
const ROLLBACK_FILE = path.join(process.cwd(), "antiguard_rollback.json");
function readRollback() {
  try {
    if (!fs.existsSync(ROLLBACK_FILE)) return { channels: [], roles: [] };
    return JSON.parse(fs.readFileSync(ROLLBACK_FILE, "utf8"));
  } catch {
    return { channels: [], roles: [] };
  }
}
function writeRollback(data) {
  fs.writeFileSync(ROLLBACK_FILE, JSON.stringify(data, null, 2));
}
async function snapshotChannel(ch) {
  try {
    if (!ch.guild) return;
    const data = readRollback();
    data.channels.push({
      guildId: ch.guild.id,
      id: ch.id,
      name: ch.name,
      type: ch.type,
      position: ch.position,
      parentId: ch.parentId || null,
      topic: ch.topic || null,
      nsfw: ch.nsfw || false,
      rateLimitPerUser: ch.rateLimitPerUser || 0,
      createdAt: Date.now()
    });
    writeRollback(data);
  } catch {}
}
async function snapshotRole(role) {
  try {
    if (!role.guild) return;
    const data = readRollback();
    data.roles.push({
      guildId: role.guild.id,
      id: role.id,
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      permissions: role.permissions.bitfield,
      mentionable: role.mentionable,
      position: role.position,
      createdAt: Date.now()
    });
    writeRollback(data);
  } catch {}
}
async function restoreChannels(guild) {
  try {
    const data = readRollback();
    const toRestore = data.channels.filter(c => c.guildId === guild.id);
    for (const c of toRestore) {
      // check exists already by name to avoid duplicates
      if (guild.channels.cache.find(x => x.name === c.name)) continue;
      await guild.channels.create({
        name: c.name,
        type: c.type,
        topic: c.topic || undefined,
        nsfw: c.nsfw || false,
        rateLimitPerUser: c.rateLimitPerUser || 0,
        parent: c.parentId || null,
        position: c.position || undefined
      }).catch(()=>{});
    }
  } catch (e) { console.error("restoreChannels error:", e); }
}
async function restoreRoles(guild) {
  try {
    const data = readRollback();
    const toRestore = data.roles.filter(r => r.guildId === guild.id);
    for (const r of toRestore) {
      if (guild.roles.cache.find(x => x.name === r.name)) continue;
      await guild.roles.create({
        name: r.name,
        color: r.color || undefined,
        hoist: r.hoist || false,
        permissions: r.permissions || undefined,
        mentionable: r.mentionable || false,
        position: r.position || undefined
      }).catch(()=>{});
    }
  } catch (e) { console.error("restoreRoles error:", e); }
}

// Defaults
const DEFAULTS = {
  protectionEnabled: false,
  panicMode: false,
  logChannelId: null,
  adminRoleId: null,
  whitelist: [], // user IDs
  thresholds: {
    roleCreateLimit: 4,
    channelCreateLimit: 4,
    webhookCreateLimit: 4,
    banLimit: 3,
    timeWindowMs: 5000
  },
  autoPunish: {
    roleCreate: "ban",
    roleDelete: "ban",
    channelCreate: "ban",
    channelDelete: "ban",
    webhookCreate: "ban",
    massBan: "ban",
    botAdd: "ban",
    dangerousPermGrant: "removeroles"
  }
};

// In-memory counters: key `${guildId}:${type}:${userId}` -> timestamps[]
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
function cleanupCounters() {
  const now = Date.now();
  for (const [k, arr] of counters.entries()) {
    if (!arr.length || now - arr[arr.length-1] > 10*60*1000) counters.delete(k);
  }
}
setInterval(cleanupCounters, 60_000);

// Config helpers
async function getCfg(guildId) {
  const raw = await db.get(`antiguard_cfg_${guildId}`) || {};
  // deep merge defaults
  return {
    ...DEFAULTS,
    ...raw,
    thresholds: { ...DEFAULTS.thresholds, ...(raw.thresholds||{}) },
    autoPunish: { ...DEFAULTS.autoPunish, ...(raw.autoPunish||{}) }
  };
}
async function setCfg(guildId, cfg) {
  await db.set(`antiguard_cfg_${guildId}`, cfg);
}

// Exempt check
async function isExempt(member) {
  if (!member) return false;
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions?.has && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const cfg = await getCfg(member.guild.id);
  if (cfg.adminRoleId && member.roles.cache.has(cfg.adminRoleId)) return true;
  if ((cfg.whitelist||[]).includes(member.id)) return true;
  return false;
}

// Safe punish
async function applyPunish(guild, targetId, kind, reason) {
  try {
    const member = await guild.members.fetch(targetId).catch(()=>null);
    if (!member) return { ok:false, error:"notfound" };
    if (await isExempt(member)) return { ok:false, error:"exempt" };

    if (kind === "ban") {
      await guild.members.ban(targetId, { reason }).catch(()=>{});
      return { ok:true, action:"ban" };
    }
    if (kind === "timeout") {
      await member.timeout(15*60*1000, reason).catch(()=>{});
      return { ok:true, action:"timeout" };
    }
    if (kind === "removeroles") {
      const roles = member.roles.cache.filter(r => r.id !== guild.id).map(r=>r.id);
      if (roles.length) await member.roles.remove(roles).catch(()=>{});
      return { ok:true, action:"removeroles" };
    }
    return { ok:false, error:"unknownkind" };
  } catch (e) {
    return { ok:false, error:String(e) };
  }
}
async function sendLog(guild, embed) {
  try {
    const cfg = await getCfg(guild.id);
    if (cfg.logChannelId) {
      const ch = guild.channels.cache.get(cfg.logChannelId) || await guild.channels.fetch(cfg.logChannelId).catch(()=>null);
      if (ch && ch.send) return ch.send({ embeds: [embed] }).catch(()=>{});
    }
    if (guild.systemChannel && guild.systemChannel.send) return guild.systemChannel.send({ embeds: [embed] }).catch(()=>{});
  } catch {}
}

// consolidated handler
async function handleBadActor(guild, executor, type, details = {}) {
  try {
    if (!executor) return;
    const member = await guild.members.fetch(executor.id).catch(()=>null);
    if (!member) return;
    if (await isExempt(member)) return;
    const cfg = await getCfg(guild.id);
    const kind = cfg.autoPunish[type] || "ban";

    // snapshot
    if (details.snapshotChannel) await snapshotChannel(details.snapshotChannel).catch(()=>{});
    if (details.snapshotRole) await snapshotRole(details.snapshotRole).catch(()=>{});

    // conservative - remove roles first if manageable
    try {
      if (member.manageable) {
        const roles = member.roles.cache.filter(r => r.id !== guild.id).map(r=>r.id);
        if (roles.length) await member.roles.remove(roles).catch(()=>{});
      }
    } catch {}

    const res = await applyPunish(guild, executor.id, kind, `AntiGuard auto (${type})`).catch(()=>({ok:false}));

    const embed = new EmbedBuilder()
      .setTitle("🚨 AntiGuard — Tehlike Engellendi")
      .setColor("Red")
      .setDescription(`**Tür:** ${type}\n**Fail:** <@${executor.id}> (${executor.tag})\n**Uygulanan:** ${res.ok ? res.action : "uygulama başarısız"}`)
      .setTimestamp();
    if (details.info) embed.addFields({ name:"Detay", value:details.info });

    await sendLog(guild, embed);

    // Panic mode extra: lock server verification level if configured
    if (cfg.panicMode) {
      try { await guild.setVerificationLevel(4); } catch {}
    }
  } catch (e) {
    console.error("handleBadActor error:", e);
  }
}

// Robust audit log getter: wait & double-check to reduce race conditions
async function fetchExecutorSafely(guild, auditType, targetId=null, attempts=3, delayMs=250) {
  for (let i=0;i<attempts;i++) {
    try {
      const logs = await guild.fetchAuditLogs({ type: auditType, limit: 5 }).catch(()=>null);
      if (!logs) { await new Promise(r=>setTimeout(r, delayMs)); continue; }
      // If targetId provided, search entries with matching targetId
      const entry = targetId ? logs.entries.find(e=>String(e.targetId) === String(targetId)) || logs.entries.first() : logs.entries.first();
      if (entry && entry.executor) return entry.executor;
    } catch {}
    await new Promise(r=>setTimeout(r, delayMs));
  }
  return null;
}

// Register core handlers
async function registerHandlers(client) {
  // avoid double-init
  if (client._antiguard_registered) return;
  client._antiguard_registered = true;

  // Role create
  client.on(Events.RoleCreate, async (role) => {
    try {
      const guild = role.guild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      const executor = await fetchExecutorSafely(guild, AuditLogEvent.RoleCreate, role.id);
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "roleCreate", executor.id, cfg.thresholds.timeWindowMs);
      // snapshot role for potential restore
      await snapshotRole(role).catch(()=>{});
      if (count >= cfg.thresholds.roleCreateLimit) {
        await handleBadActor(guild, executor, "roleCreate", { snapshotRole: role, info:`Oluşturulan: ${role.name} (${role.id})` });
        try { await role.delete("AntiGuard cleanup: role spam").catch(()=>{}); } catch {}
      }
    } catch (e) { console.error("RoleCreate handler error:", e); }
  });

  // Role delete
  client.on(Events.GuildRoleDelete, async (role) => {
    try {
      const guild = role.guild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      const executor = await fetchExecutorSafely(guild, AuditLogEvent.RoleDelete, role.id);
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "roleDelete", executor.id, cfg.thresholds.timeWindowMs);
      await snapshotRole(role).catch(()=>{});
      if (count >= cfg.thresholds.roleCreateLimit) {
        await handleBadActor(guild, executor, "roleDelete", { info:`Silinen: ${role.name} (${role.id})` });
        setTimeout(()=> restoreRoles(guild).catch(()=>{}), 2000);
      }
    } catch (e) { console.error("RoleDelete handler error:", e); }
  });

  // Channel create
  client.on(Events.ChannelCreate, async (ch) => {
    try {
      const guild = ch.guild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      const executor = await fetchExecutorSafely(guild, AuditLogEvent.ChannelCreate, ch.id);
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "channelCreate", executor.id, cfg.thresholds.timeWindowMs);
      await snapshotChannel(ch).catch(()=>{});
      if (count >= cfg.thresholds.channelCreateLimit) {
        await handleBadActor(guild, executor, "channelCreate", { snapshotChannel: ch, info:`Oluşturulan: ${ch.name} (${ch.id})` });
        try { await ch.delete("AntiGuard cleanup: channel spam").catch(()=>{}); } catch {}
      }
    } catch (e) { console.error("ChannelCreate handler error:", e); }
  });

  // Channel delete
  client.on(Events.ChannelDelete, async (ch) => {
    try {
      const guild = ch.guild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      const executor = await fetchExecutorSafely(guild, AuditLogEvent.ChannelDelete, ch.id);
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "channelDelete", executor.id, cfg.thresholds.timeWindowMs);
      await snapshotChannel(ch).catch(()=>{});
      if (count >= cfg.thresholds.channelCreateLimit) {
        await handleBadActor(guild, executor, "channelDelete", { info:`Silinen: ${ch.name} (${ch.id})` });
        setTimeout(()=> restoreChannels(guild).catch(()=>{}), 2000);
      }
    } catch (e) { console.error("ChannelDelete handler error:", e); }
  });

  // Webhook update
  client.on(Events.WebhookUpdate, async (ch) => {
    try {
      const guild = ch.guild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      const audit = await guild.fetchAuditLogs({ limit: 6 }).catch(()=>null);
      if (!audit) return;
      const entry = audit.entries.find(e => [AuditLogEvent.WebhookCreate, AuditLogEvent.WebhookDelete].includes(e.action));
      if (!entry) return;
      const executor = entry.executor;
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "webhook", executor.id, cfg.thresholds.timeWindowMs);
      if (count >= cfg.thresholds.webhookCreateLimit) {
        await handleBadActor(guild, executor, "webhookSpam", { info: `Webhook update in ${ch.name || 'channel'}` });
      } else {
        const embed = new EmbedBuilder().setTitle("⚠️ Webhook güncellemesi").setColor("Orange").setDescription(`Kanal: ${ch.name}\nFail: ${executor.tag}`);
        await sendLog(guild, embed);
      }
    } catch (e) { console.error("WebhookUpdate handler error:", e); }
  });

  // Guild Ban add (mass bans)
  client.on(Events.GuildBanAdd, async (guild, user) => {
    try {
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      const entry = (await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 }).catch(()=>null))?.entries.first();
      if (!entry) return;
      const executor = entry.executor;
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "ban", executor.id, cfg.thresholds.timeWindowMs);
      const limit = cfg.thresholds.banLimit || DEFAULTS.thresholds.banLimit;
      if (count >= limit) {
        await handleBadActor(guild, executor, "massBan", { info:`Son banlanan: ${user.tag || user.id}` });
      } else {
        const embed = new EmbedBuilder().setTitle("⚠️ Şüpheli ban").setColor("DarkRed").setDescription(`Yapan: ${executor.tag}\nHedef: ${user.tag || user.id}\nSayaç: ${count}/${limit}`);
        await sendLog(guild, embed);
      }
    } catch (e) { console.error("GuildBanAdd handler error:", e); }
  });

  // Role update (dangerous perms)
  client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    try {
      const guild = newRole.guild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      const dangerous = [ PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers ];
      for (const p of dangerous) {
        const had = oldRole.permissions.has(p);
        const hasNow = newRole.permissions.has(p);
        if (!had && hasNow) {
          const executor = await fetchExecutorSafely(guild, AuditLogEvent.RoleUpdate);
          if (!executor || executor.id === client.user.id) return;
          const member = await guild.members.fetch(executor.id).catch(()=>null);
          if (!member) return;
          if (await isExempt(member)) return;

          // revert role perms
          await newRole.setPermissions(oldRole.permissions).catch(()=>{});
          await handleBadActor(guild, executor, "dangerousPermGrant", { info:`Rol: ${newRole.name}` });
          return;
        }
      }
    } catch (e) { console.error("GuildRoleUpdate handler error:", e); }
  });

  // Guild update (name/icon revert)
  client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    try {
      const guild = newGuild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;

      if (oldGuild.name !== newGuild.name) {
        const entry = (await guild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 5 }).catch(()=>null))?.entries.first();
        const executor = entry?.executor;
        if (executor && executor.id !== client.user.id) {
          const member = await guild.members.fetch(executor.id).catch(()=>null);
          if (member && !await isExempt(member)) {
            await newGuild.setName(oldGuild.name).catch(()=>{});
            await handleBadActor(guild, executor, "guildNameChange", { info:`Eski: ${oldGuild.name}` });
          }
        }
      }
      if (oldGuild.icon !== newGuild.icon) {
        const entry = (await guild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 5 }).catch(()=>null))?.entries.first();
        const executor = entry?.executor;
        if (executor && executor.id !== client.user.id) {
          const member = await guild.members.fetch(executor.id).catch(()=>null);
          if (member && !await isExempt(member)) {
            await newGuild.setIcon(oldGuild.iconURL() || null).catch(()=>{});
            await handleBadActor(guild, executor, "guildIconChange", { info:`Icon reverted` });
          }
        }
      }
    } catch (e) { console.error("GuildUpdate handler error:", e); }
  });

  // Bot add detection
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const guild = member.guild;
      const cfg = await getCfg(guild.id);
      if (!cfg.protectionEnabled) return;
      if (!member.user.bot) return;

      const audit = await guild.fetchAuditLogs({ limit: 8 }).catch(()=>null);
      if (!audit) return;
      const entry = audit.entries.find(e => e.targetId === member.user.id && e.action === AuditLogEvent.BotAdd);
      const executor = entry?.executor;
      if (!executor || executor.id === client.user.id) return;
      const execMember = await guild.members.fetch(executor.id).catch(()=>null);
      if (!execMember) return;
      if (await isExempt(execMember)) return;

      await handleBadActor(guild, executor, "botAdd", { info: `Bot: ${member.user.tag}` });
      await guild.members.ban(member.user.id, { reason: "Unauthorized bot added" }).catch(()=>{});
    } catch (e) { /* ignore */ }
  });

  console.log("[ANTIGUARD] handlers ready");
}

// Slash command
const cmd = new SlashCommandBuilder()
  .setName("antiguard")
  .setDescription("Gelişmiş Anti-Nuke / Anti-Abuse sistemi - panel ve ayarlar")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sc => sc.setName("status").setDescription("Koruma durumunu gösterir"))
  .addSubcommand(sc => sc.setName("enable").setDescription("Koruma modunu açar"))
  .addSubcommand(sc => sc.setName("disable").setDescription("Koruma modunu kapatır"))
  .addSubcommand(sc => sc.setName("panic").setDescription("Panic modu: hızlı önlem (kilitle)"))
  .addSubcommand(sc => sc.setName("setlog").setDescription("Log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Log kanalı").setRequired(true)))
  .addSubcommand(sc => sc.setName("setadminrole").setDescription("Koruma bypass rolü ayarla").addRoleOption(o => o.setName("rol").setDescription("Bypass rolü").setRequired(true)))
  .addSubcommand(sc => sc.setName("whitelist-add").setDescription("Whitelist kullanıcı ekle").addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true)))
  .addSubcommand(sc => sc.setName("whitelist-remove").setDescription("Whitelist kullanıcı çıkar").addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true)))
  .addSubcommand(sc => sc.setName("restore").setDescription("Rollback: kaydedilmiş roller/kanalları geri yükle"));

module.exports = {
  data: cmd,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const cfg = await getCfg(guildId);

    if (sub === "status") {
      const embed = new EmbedBuilder()
        .setTitle("🛡 AntiGuard Durumu")
        .setColor(cfg.protectionEnabled ? "Green" : "Red")
        .addFields(
          { name: "Koruma", value: cfg.protectionEnabled ? "Açık" : "Kapalı", inline: true },
          { name: "Panic Mode", value: cfg.panicMode ? "Aktif" : "Kapalı", inline: true },
          { name: "Log Kanalı", value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : "Ayarlı değil", inline: true },
          { name: "Admin Rolü (Bypass)", value: cfg.adminRoleId ? `<@&${cfg.adminRoleId}>` : "Ayarlı değil", inline: true },
          { name: "Rol oluşturma limiti", value: `${cfg.thresholds.roleCreateLimit} / ${cfg.thresholds.timeWindowMs}ms`, inline: true },
          { name: "Kanal oluşturma limiti", value: `${cfg.thresholds.channelCreateLimit} / ${cfg.thresholds.timeWindowMs}ms`, inline: true },
          { name: "Ban limiti", value: `${cfg.thresholds.banLimit} / ${cfg.thresholds.timeWindowMs}ms`, inline: true }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "enable") {
      cfg.protectionEnabled = true;
      await setCfg(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ AntiGuard Aktif").setColor("Green").setDescription("Koruma başarıyla açıldı.") ], ephemeral: true });
    }

    if (sub === "disable") {
      cfg.protectionEnabled = false;
      await setCfg(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("⚠️ AntiGuard Devre Dışı").setColor("Red").setDescription("Koruma kapatıldı.") ], ephemeral: true });
    }

    if (sub === "panic") {
      cfg.panicMode = !cfg.panicMode;
      await setCfg(guildId, cfg);
      if (cfg.panicMode) {
        try { await interaction.guild.setVerificationLevel(4); } catch {}
        await interaction.reply({ embeds: [ new EmbedBuilder().setTitle("🚨 Panic Mode Aktif").setColor("Orange").setDescription("Sunucu geçici olarak kilitlendi ve yüksek önlem moduna alındı.") ], ephemeral: true });
      } else {
        try { await interaction.guild.setVerificationLevel(1); } catch {}
        await interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Panic Mode Devre Dışı").setColor("Green").setDescription("Sunucu kilidi kaldırıldı.") ], ephemeral: true });
      }
      return;
    }

    if (sub === "setlog") {
      const ch = interaction.options.getChannel("kanal");
      cfg.logChannelId = ch.id;
      await setCfg(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Log Kanalı Ayarlandı").setColor("Blue").setDescription(`Log kanalı: <#${ch.id}>`) ], ephemeral: true });
    }

    if (sub === "setadminrole") {
      const role = interaction.options.getRole("rol");
      cfg.adminRoleId = role.id;
      await setCfg(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Admin Rolü Ayarlandı").setColor("Blue").setDescription(`Bypass rolü: <@&${role.id}>`) ], ephemeral: true });
    }

    if (sub === "whitelist-add") {
      const user = interaction.options.getUser("kullanici");
      cfg.whitelist = cfg.whitelist || [];
      if (!cfg.whitelist.includes(user.id)) cfg.whitelist.push(user.id);
      await setCfg(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Whitelist eklendi").setColor("Green").setDescription(`${user.tag} whitelist'e eklendi.`) ], ephemeral: true });
    }

    if (sub === "whitelist-remove") {
      const user = interaction.options.getUser("kullanici");
      cfg.whitelist = cfg.whitelist || [];
      cfg.whitelist = cfg.whitelist.filter(x=>x!==user.id);
      await setCfg(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Whitelist çıkarıldı").setColor("Green").setDescription(`${user.tag} whitelist'ten çıkarıldı.`) ], ephemeral: true });
    }

    if (sub === "restore") {
      await interaction.reply({ embeds: [ new EmbedBuilder().setTitle("🔁 Restore başlatıldı").setColor("Blue").setDescription("Rollback: roller ve kanallar yeniden oluşturuluyor...") ], ephemeral: true });
      try {
        await restoreRoles(interaction.guild);
        await restoreChannels(interaction.guild);
        await interaction.followUp({ embeds: [ new EmbedBuilder().setTitle("✅ Restore tamamlandı").setColor("Green") ], ephemeral: true });
      } catch (e) {
        await interaction.followUp({ embeds: [ new EmbedBuilder().setTitle("❌ Restore hatası").setDescription(String(e)).setColor("Red") ], ephemeral: true });
      }
    }
  },

  // init: call after client login
  init: async (client) => {
    await registerHandlers(client);
  }
};
