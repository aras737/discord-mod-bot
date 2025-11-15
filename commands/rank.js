// commands/antiguard.js
// Single-file, production-ready Anti-Nuke / Anti-Abuse system with a single slash command to configure.
// Usage:
// 1) Place this file in commands/antiguard.js
// 2) Register slash commands as usual; this module's command name is "antiguard".
// 3) After client login call: require('./commands/antiguard').init(client);
// Requires: discord.js v14, quick.db (QuickDB), node 16+
// Permissions: bot must have ManageRoles, BanMembers, ManageChannels, ManageGuild, ViewAuditLog, ModerateMembers
// Privileged intents: GuildMembers recommended.

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AuditLogEvent, Events } = require("discord.js");
const { QuickDB } = require("quick.db");
const fs = require("fs");
const path = require("path");

const db = new QuickDB();

// rollback storage (local file)
const ROLLBACK_PATH = path.join(process.cwd(), "antiguard_rollback.json");
function loadRollback() {
  try {
    if (!fs.existsSync(ROLLBACK_PATH)) return { channels: [], roles: [] };
    return JSON.parse(fs.readFileSync(ROLLBACK_PATH, "utf8"));
  } catch {
    return { channels: [], roles: [] };
  }
}
function saveRollback(data) {
  fs.writeFileSync(ROLLBACK_PATH, JSON.stringify(data, null, 2));
}
async function snapshotChannel(ch) {
  const data = loadRollback();
  data.channels.push({
    guildId: ch.guild.id,
    name: ch.name,
    type: ch.type,
    position: ch.position,
    parentId: ch.parentId || null,
    topic: ch.topic || null,
    nsfw: ch.nsfw || false,
    rateLimitPerUser: ch.rateLimitPerUser || 0,
    createdAt: Date.now()
  });
  saveRollback(data);
}
async function snapshotRole(role) {
  const data = loadRollback();
  data.roles.push({
    guildId: role.guild.id,
    name: role.name,
    color: role.color,
    hoist: role.hoist,
    permissions: role.permissions.bitfield,
    mentionable: role.mentionable,
    position: role.position,
    createdAt: Date.now()
  });
  saveRollback(data);
}
async function restoreChannels(guild) {
  const data = loadRollback();
  const toRestore = data.channels.filter(c => c.guildId === guild.id);
  for (const c of toRestore) {
    try {
      await guild.channels.create({
        name: c.name,
        type: c.type,
        topic: c.topic,
        nsfw: c.nsfw,
        parent: c.parentId || null,
        rateLimitPerUser: c.rateLimitPerUser || 0,
        position: c.position
      }).catch(()=>{});
    } catch {}
  }
}
async function restoreRoles(guild) {
  const data = loadRollback();
  const toRestore = data.roles.filter(r => r.guildId === guild.id);
  for (const r of toRestore) {
    try {
      await guild.roles.create({
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        permissions: r.permissions,
        mentionable: r.mentionable,
        position: r.position
      }).catch(()=>{});
    } catch {}
  }
}

// Defaults
const DEFAULTS = {
  protectionEnabled: false,
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
    roleCreate: "ban",        // ban | timeout | removeroles | none
    roleDelete: "ban",
    channelCreate: "ban",
    channelDelete: "ban",
    webhookCreate: "ban",
    massBan: "ban",
    botAdd: "ban",
    dangerousPermGrant: "removeroles"
  }
};

// in-memory counters: Map keys -> `${guildId}:${type}:${userId}` -> [timestamps]
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
function clearOldCounters() {
  const now = Date.now();
  for (const [k, arr] of counters.entries()) {
    if (!arr.length || now - arr[arr.length - 1] > 10 * 60 * 1000) counters.delete(k);
  }
}
setInterval(clearOldCounters, 60_000);

// helpers
async function getGuildConfig(guildId) {
  const cfg = await db.get(`antiguard_cfg_${guildId}`) || {};
  return { ...DEFAULTS, ...cfg, thresholds: { ...DEFAULTS.thresholds, ...(cfg.thresholds||{}) }, autoPunish: { ...DEFAULTS.autoPunish, ...(cfg.autoPunish||{}) } };
}
async function setGuildConfig(guildId, newcfg) {
  await db.set(`antiguard_cfg_${guildId}`, newcfg);
}

// check exemption: owner, admin perms, configured adminRole, whitelist
async function isExempt(member) {
  if (!member) return false;
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions?.has && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const cfg = await getGuildConfig(member.guild.id);
  if (cfg.adminRoleId && member.roles.cache.has(cfg.adminRoleId)) return true;
  const wl = cfg.whitelist || [];
  if (wl.includes(member.id)) return true;
  return false;
}

// apply punishment
async function applyPunish(guild, targetId, kind, reason) {
  try {
    const member = await guild.members.fetch(targetId).catch(()=>null);
    if (!member) return { ok: false, error: "not found" };
    if (kind === "ban") {
      await guild.members.ban(targetId, { reason }).catch(()=>{});
      return { ok: true, action: "ban" };
    }
    if (kind === "timeout") {
      await member.timeout(15 * 60 * 1000, reason).catch(()=>{});
      return { ok: true, action: "timeout" };
    }
    if (kind === "removeroles") {
      const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.id).map(r=>r.id);
      if (rolesToRemove.length) await member.roles.remove(rolesToRemove).catch(()=>{});
      return { ok: true, action: "removeroles" };
    }
    return { ok: false, error: "unknown" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
async function sendLog(guild, embed) {
  try {
    const cfg = await getGuildConfig(guild.id);
    if (cfg.logChannelId) {
      const ch = guild.channels.cache.get(cfg.logChannelId) || await guild.channels.fetch(cfg.logChannelId).catch(()=>null);
      if (ch && ch.send) return ch.send({ embeds: [embed] }).catch(()=>{});
    }
    if (guild.systemChannel && guild.systemChannel.send) return guild.systemChannel.send({ embeds: [embed] }).catch(()=>{});
  } catch {}
}

// punishment & log wrapper
async function handleBadActor(guild, executor, type, details = {}) {
  try {
    if (!executor) return;
    const member = await guild.members.fetch(executor.id).catch(()=>null);
    if (!member) return;
    if (await isExempt(member)) return;

    const cfg = await getGuildConfig(guild.id);
    const kind = cfg.autoPunish[type] || "ban";

    // take snapshot if roles/channels were affected
    if (details.snapshotChannel) await snapshotChannel(details.snapshotChannel).catch(()=>{});
    if (details.snapshotRole) await snapshotRole(details.snapshotRole).catch(()=>{});

    // attempt conservative action: remove roles then punish
    try {
      if (member.manageable) {
        const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.id).map(r=>r.id);
        if (rolesToRemove.length) await member.roles.remove(rolesToRemove).catch(()=>{});
      }
    } catch {}

    const res = await applyPunish(guild, executor.id, kind, `Auto-protect (${type})`).catch(()=>({ok:false}));

    const embed = new EmbedBuilder()
      .setTitle("🚨 Anti-Nuke — Tehlike Engellendi")
      .setColor("Red")
      .setDescription(`**Tür:** ${type}\n**Fail:** <@${executor.id}> (${executor.tag})\n**Uygulanan:** ${res.ok ? res.action : "uygulama başarısız"}`)
      .setTimestamp();

    if (details.info) embed.addFields({ name: "Detay", value: details.info, inline: false });

    await sendLog(guild, embed);
  } catch (e) {
    console.error("handleBadActor error:", e);
  }
}

// Core event handlers (to be attached in init)
async function registerHandlers(client) {
  // role create
  client.on(Events.RoleCreate, async (role) => {
    try {
      const guild = role.guild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      // audit
      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(()=>null);
      const entry = audit?.entries.first();
      if (!entry) return;
      const executor = entry.executor;
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "roleCreate", executor.id, cfg.thresholds.timeWindowMs);
      if (count >= cfg.thresholds.roleCreateLimit) {
        await handleBadActor(guild, executor, "roleCreate", { snapshotRole: role, info: `Oluşturulan rol: ${role.name} (${role.id})` });
        // delete the role (cleanup)
        try { await role.delete("Anti-Nuke: role spam cleanup").catch(()=>{}); } catch {}
      } else {
        // snapshot for rollback if needed
        await snapshotRole(role).catch(()=>{});
      }
    } catch (e) { console.error("RoleCreate handler error:", e); }
  });

  // role delete
  client.on(Events.GuildRoleDelete, async (role) => {
    try {
      const guild = role.guild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(()=>null);
      const entry = audit?.entries.first();
      if (!entry) return;
      const executor = entry.executor;
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "roleDelete", executor.id, cfg.thresholds.timeWindowMs);
      if (count >= cfg.thresholds.roleCreateLimit) {
        await handleBadActor(guild, executor, "roleDelete", { info: `Silinen rol: ${role.name} (${role.id})` });
        // attempt restore later
        setTimeout(()=> restoreRoles(guild).catch(()=>{}), 2000);
      } else {
        // save snapshot for restore
        await snapshotRole(role).catch(()=>{});
      }
    } catch (e) { console.error("RoleDelete handler error:", e); }
  });

  // channel create
  client.on(Events.ChannelCreate, async (ch) => {
    try {
      const guild = ch.guild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 }).catch(()=>null);
      const entry = audit?.entries.first();
      if (!entry) return;
      const executor = entry.executor;
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "channelCreate", executor.id, cfg.thresholds.timeWindowMs);
      if (count >= cfg.thresholds.channelCreateLimit) {
        await handleBadActor(guild, executor, "channelCreate", { snapshotChannel: ch, info: `Oluşturulan kanal: ${ch.name} (${ch.id})` });
        try { await ch.delete("Anti-Nuke: channel spam cleanup").catch(()=>{}); } catch {}
      } else {
        await snapshotChannel(ch).catch(()=>{});
      }
    } catch (e) { console.error("ChannelCreate handler error:", e); }
  });

  // channel delete
  client.on(Events.ChannelDelete, async (ch) => {
    try {
      const guild = ch.guild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(()=>null);
      const entry = audit?.entries.first();
      if (!entry) return;
      const executor = entry.executor;
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "channelDelete", executor.id, cfg.thresholds.timeWindowMs);
      if (count >= cfg.thresholds.channelCreateLimit) {
        await handleBadActor(guild, executor, "channelDelete", { info: `Silinen kanal: ${ch.name} (${ch.id})` });
        setTimeout(()=> restoreChannels(guild).catch(()=>{}), 2000);
      } else {
        await snapshotChannel(ch).catch(()=>{});
      }
    } catch (e) { console.error("ChannelDelete handler error:", e); }
  });

  // webhookUpdate - generic (can't easily get creator), just log and check frequency per executor via recent audit logs
  client.on(Events.WebhookUpdate, async (ch) => {
    try {
      const guild = ch.guild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      // fetch recent audit logs for webhook create/delete
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
        const embed = new EmbedBuilder()
          .setTitle("⚠️ Webhook güncellemesi algılandı")
          .setColor("Orange")
          .setDescription(`Kanal: ${ch.name}\nOlayı yapan: ${executor.tag}`);
        await sendLog(guild, embed);
      }
    } catch (e) { console.error("WebhookUpdate handler error:", e); }
  });

  // guild ban add (mass ban detection)
  client.on(Events.GuildBanAdd, async (guild, user) => {
    try {
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 }).catch(()=>null);
      const entry = audit?.entries.first();
      if (!entry) return;
      const executor = entry.executor;
      if (!executor || executor.id === client.user.id) return;

      const count = pushAction(guild.id, "ban", executor.id, cfg.thresholds.timeWindowMs);
      const limit = cfg.thresholds.banLimit || DEFAULTS.thresholds.banLimit;
      if (count >= limit) {
        await handleBadActor(guild, executor, "massBan", { info: `Mass bans detected; last banned: ${user.tag || user.id}` });
      } else {
        const embed = new EmbedBuilder()
          .setTitle("⚠️ Şüpheli ban hareketi")
          .setColor("DarkRed")
          .setDescription(`Yapan: ${executor.tag}\nHedef: ${user.tag || user.id}\nSayaç: ${count}/${limit}`);
        await sendLog(guild, embed);
      }
    } catch (e) { console.error("GuildBanAdd handler error:", e); }
  });

  // role update (dangerous perms added)
  client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    try {
      const guild = newRole.guild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      // detect newly added dangerous permissions
      const dangerous = [ PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers ];
      for (const p of dangerous) {
        const had = oldRole.permissions.has(p);
        const hasNow = newRole.permissions.has(p);
        if (!had && hasNow) {
          const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 }).catch(()=>null);
          const entry = audit?.entries.first();
          if (!entry) return;
          const executor = entry.executor;
          if (!executor || executor.id === client.user.id) return;
          const member = await guild.members.fetch(executor.id).catch(()=>null);
          if (!member) return;
          if (await isExempt(member)) return;

          // revert
          await newRole.setPermissions(oldRole.permissions).catch(()=>{});
          await handleBadActor(guild, executor, "dangerousPermGrant", { info: `Rol: ${newRole.name}` });
          return;
        }
      }
    } catch (e) { console.error("GuildRoleUpdate handler error:", e); }
  });

  // guild update (name/icon)
  client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    try {
      const guild = newGuild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;

      // name change
      if (oldGuild.name !== newGuild.name) {
        const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 }).catch(()=>null);
        const entry = audit?.entries.first();
        const executor = entry?.executor;
        if (executor && executor.id !== client.user.id) {
          const member = await guild.members.fetch(executor.id).catch(()=>null);
          if (member && !await isExempt(member)) {
            await newGuild.setName(oldGuild.name).catch(()=>{});
            await handleBadActor(guild, executor, "guildNameChange", { info: `Eski isim: ${oldGuild.name}` });
          }
        }
      }
      // icon change
      if (oldGuild.icon !== newGuild.icon) {
        const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 }).catch(()=>null);
        const entry = audit?.entries.first();
        const executor = entry?.executor;
        if (executor && executor.id !== client.user.id) {
          const member = await guild.members.fetch(executor.id).catch(()=>null);
          if (member && !await isExempt(member)) {
            await newGuild.setIcon(oldGuild.iconURL() || null).catch(()=>{});
            await handleBadActor(guild, executor, "guildIconChange", { info: `Icon reverted` });
          }
        }
      }
    } catch (e) { console.error("GuildUpdate handler error:", e); }
  });

  // bot add detection (guildMemberAdd with bot true)
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const guild = member.guild;
      const cfg = await getGuildConfig(guild.id);
      if (!cfg.protectionEnabled) return;
      if (!member.user.bot) return;

      const audit = await guild.fetchAuditLogs({ limit: 6 }).catch(()=>null);
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

  console.log("[ANTIGUARD] Handlers registered.");
}

// Command definition (slash)
const command = new SlashCommandBuilder()
  .setName("antiguard")
  .setDescription("Anti-Nuke / Abuse koruma ayar paneli")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sc => sc.setName("status").setDescription("Koruma durumunu göster"))
  .addSubcommand(sc => sc.setName("enable").setDescription("Koruma aç"))
  .addSubcommand(sc => sc.setName("disable").setDescription("Koruma kapa"))
  .addSubcommand(sc => sc.setName("setlog").setDescription("Log kanalı ayarla").addChannelOption(o => o.setName("kanal").setDescription("Log kanalı").setRequired(true)))
  .addSubcommand(sc => sc.setName("setadminrole").setDescription("Koruma için bypass rolü ayarla").addRoleOption(o => o.setName("rol").setDescription("Yönetici rolü").setRequired(true)))
  .addSubcommand(sc => sc.setName("whitelist-add").setDescription("Whitelist kullanıcı ekle").addUserOption(o=>o.setName("kullanici").setRequired(true)))
  .addSubcommand(sc => sc.setName("whitelist-remove").setDescription("Whitelist kullanıcı çıkar").addUserOption(o=>o.setName("kullanici").setRequired(true)))
  .addSubcommand(sc => sc.setName("restore").setDescription("Rollback: kaydedilmiş roller/kanalları geri yükle"));

module.exports = {
  data: command,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const cfg = await getGuildConfig(guildId);

    if (sub === "status") {
      const embed = new EmbedBuilder()
        .setTitle("🛡 AntiGuard Durumu")
        .setColor(cfg.protectionEnabled ? "Green" : "Red")
        .addFields(
          { name: "Koruma", value: cfg.protectionEnabled ? "Açık" : "Kapalı", inline: true },
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
      await setGuildConfig(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ AntiGuard Aktif").setColor("Green").setDescription("Koruma başarıyla açıldı.") ], ephemeral: true });
    }

    if (sub === "disable") {
      cfg.protectionEnabled = false;
      await setGuildConfig(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("⚠️ AntiGuard Devre Dışı").setColor("Red").setDescription("Koruma kapatıldı.") ], ephemeral: true });
    }

    if (sub === "setlog") {
      const ch = interaction.options.getChannel("kanal");
      cfg.logChannelId = ch.id;
      await setGuildConfig(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Log Kanalı Ayarlandı").setColor("Blue").setDescription(`Log kanalı: <#${ch.id}>`) ], ephemeral: true });
    }

    if (sub === "setadminrole") {
      const role = interaction.options.getRole("rol");
      cfg.adminRoleId = role.id;
      await setGuildConfig(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Admin Rolü Ayarlandı").setColor("Blue").setDescription(`Bypass rolü: <@&${role.id}>`) ], ephemeral: true });
    }

    if (sub === "whitelist-add") {
      const user = interaction.options.getUser("kullanici");
      cfg.whitelist = cfg.whitelist || [];
      if (!cfg.whitelist.includes(user.id)) cfg.whitelist.push(user.id);
      await setGuildConfig(guildId, cfg);
      return interaction.reply({ embeds: [ new EmbedBuilder().setTitle("✅ Whitelist eklendi").setColor("Green").setDescription(`${user.tag} whitelist'e eklendi.`) ], ephemeral: true });
    }

    if (sub === "whitelist-remove") {
      const user = interaction.options.getUser("kullanici");
      cfg.whitelist = cfg.whitelist || [];
      cfg.whitelist = cfg.whitelist.filter(x=>x!==user.id);
      await setGuildConfig(guildId, cfg);
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

  // init must be called once after client login: require('./commands/antiguard').init(client)
  init: async (client) => {
    // attach handlers once
    if (client._antiguard_inited) return;
    client._antiguard_inited = true;
    await registerHandlers(client);
  }
};
