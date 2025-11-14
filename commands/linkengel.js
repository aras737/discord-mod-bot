// commands/modpanel.js
// Single-file Moderasyon Paneli + Otomatik Ceza Sistemi + Abuse Koruma
// Notlar:
// - Discord.js v14
// - quick.db (QuickDB) ile ayarlar/punitions saklanır
// - Dosyayı commands klasörüne koy ve index.js'inizde komutları yükleyin.
// - index.js içinde: after login, call require('./commands/modpanel').initEvents(client);
// - .env içinde DISCORD_TOKEN olmalı
// - Gerekli intent'ler: Guilds, GuildMembers, GuildBans, GuildMessages, MessageContent (gerekiyorsa)
// - Botun log atacağı kanal yoksa guild.systemChannel kullanılır
// - Kullanıcı izni: komut Admin gerektirir

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
  Events,
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

const DEFAULTS = {
  protectionEnabled: false,
  logChannelId: null,
  adminRoleId: null,
  autoPunish: {
    massChannelDelete: "ban", // ban | timeout | removeroles | none
    massRoleDelete: "ban",
    massBan: "timeout", // for mass ban, timeout by default
    dangerousPermGrant: "removeroles", // remove elevated perms
    botAdd: "ban",
  },
  thresholds: {
    massChannelDeleteWindowMs: 60_000,
    massChannelDeleteLimit: 3,
    massRoleDeleteWindowMs: 60_000,
    massRoleDeleteLimit: 3,
    massBanWindowMs: 60_000,
    massBanLimit: 3,
  },
  whitelist: [] // user IDs exempt
};

// Helper: get log channel
async function getLogChannel(guild) {
  const id = await db.get(`${guild.id}.logChannelId`) || DEFAULTS.logChannelId;
  if (id) return guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(()=>null);
  return guild.systemChannel || null;
}

// Helper: get admin role exemption
async function isExempt(member) {
  if (!member) return false;
  const adminRoleId = await db.get(`${member.guild.id}.adminRoleId`);
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;
  if (member.permissions?.has && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const wl = await db.get(`whitelist_${member.guild.id}`) || [];
  if (wl.includes(member.id)) return true;
  return false;
}

// Apply punishment function
async function applyPunish(guild, targetId, kind, reason = "Automatic protection") {
  try {
    const member = await guild.members.fetch(targetId).catch(()=>null);
    if (!member) return { ok: false, error: "Member not found" };

    if (kind === "ban") {
      await guild.members.ban(targetId, { reason }).catch(()=>{});
      return { ok: true, action: "ban" };
    }
    if (kind === "timeout") {
      // timeout for 15 minutes
      await member.timeout(15 * 60 * 1000, reason).catch(()=>{});
      return { ok: true, action: "timeout" };
    }
    if (kind === "removeroles") {
      // remove all roles except @everyone
      const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.id).map(r => r.id);
      if (rolesToRemove.length) await member.roles.remove(rolesToRemove).catch(()=>{});
      return { ok: true, action: "removeroles" };
    }
    return { ok: false, error: "Unknown kind" };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// record audit action counts in-memory (per guild/per user)
const actionCounters = new Map(); // key: `${guildId}:${type}:${userId}` -> timestamps array
function addActionCount(guildId, type, userId, windowMs) {
  const key = `${guildId}:${type}:${userId}`;
  const now = Date.now();
  if (!actionCounters.has(key)) actionCounters.set(key, []);
  const arr = actionCounters.get(key);
  arr.push(now);
  // purge old
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  actionCounters.set(key, arr);
  return arr.length;
}

// Build mod panel embed + components
function buildPanelEmbed(guild, enabled) {
  return new EmbedBuilder()
    .setTitle(enabled ? "🛡 Moderasyon Paneli — Koruma Aktif" : "⛔ Moderasyon Paneli — Koruma Kapalı")
    .setDescription("Butonlarla hızlı moderasyon yapabilirsiniz. Otomatik ceza davranışları ve koruma ayarları burada uygulanır.")
    .addFields(
      { name: "Koruma Durumu", value: enabled ? "Aktif" : "Kapalı", inline: true },
      { name: "Otomatik Ceza (örnek)", value: "Kanal silme -> ban\nRol silme -> ban\nMass ban -> timeout", inline: true },
      { name: "Not", value: "Butonlar sadece yetkili kişiler için çalışır (Admin veya config'te tanımlı rol).", inline: false }
    )
    .setColor(enabled ? 0x1abc9c : 0xe74c3c)
    .setTimestamp();
}

function buildPanelRow(enabled) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`protect_toggle:${enabled ? "off" : "on"}`)
      .setLabel(enabled ? "Koruma Kapat" : "Koruma Aç")
      .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("lock_server")
      .setLabel("Sunucuyu Kilitle")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("unlock_server")
      .setLabel("Kilit Kaldır")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("restore_roles")
      .setLabel("Restore (Roller)")
      .setStyle(ButtonStyle.Primary)
  );
}

function buildModerationMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("mod_menu")
      .setPlaceholder("Hızlı Moderasyon Menüsü")
      .addOptions([
        { label: "Toplu Timeout (seçili)", description: "Seçili kullanıcıları 15dk timeout", value: "mass_timeout" },
        { label: "Toplu Kick", description: "Seçili kullanıcıları at", value: "mass_kick" },
        { label: "Toplu Ban", description: "Seçili kullanıcıları banla", value: "mass_ban" },
        { label: "Güvenliği Aç/Kapat", description: "Koruma modu aç/kapat", value: "toggle_protect" },
      ])
  );
}

// The exported command object
module.exports = {
  data: new SlashCommandBuilder()
    .setName("modpanel")
    .setDescription("Havalı moderasyon panelini açar (embed + butonlar).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt => opt.setName("logkanal").setDescription("Opsiyonel: log kanalı ayarla"))
    .addRoleOption(opt => opt.setName("adminrol").setDescription("Opsiyonel: paneli kullanabilecek yönetici rolü")),

  async execute(interaction) {
    // set log channel / admin role if provided
    const guild = interaction.guild;
    const chan = interaction.options.getChannel("logkanal");
    const role = interaction.options.getRole("adminrol");

    if (chan) await db.set(`${guild.id}.logChannelId`, chan.id);
    if (role) await db.set(`${guild.id}.adminRoleId`, role.id);

    const enabled = await db.get(`${guild.id}.protectionEnabled`) ?? DEFAULTS.protectionEnabled;

    const embed = buildPanelEmbed(guild, enabled);
    const row = buildPanelRow(enabled);
    const menu = buildModerationMenu();

    const panelMsg = await interaction.reply({ embeds: [embed], components: [row, menu], fetchReply: true });

    // create a collector for buttons and select menu attached to this message
    const filter = i => i.message.id === panelMsg.id;
    const collector = panelMsg.createMessageComponentCollector({ time: 1000 * 60 * 60, componentType: ComponentType.Button });

    collector.on("collect", async btn => {
      await btn.deferReply({ ephemeral: true });
      try {
        const member = await guild.members.fetch(btn.user.id).catch(()=>null);
        if (!member) return btn.editReply({ content: "Üye bulunamadı.", ephemeral: true });

        // permission / role check
        if (!(member.permissions.has(PermissionFlagsBits.Administrator) || (await db.get(`${guild.id}.adminRoleId`) && member.roles.cache.has(await db.get(`${guild.id}.adminRoleId`))))) {
          return btn.editReply({ content: "Bu paneli kullanmak için yetkiniz yok.", ephemeral: true });
        }

        const [action, param] = btn.customId.split(":");

        if (action === "protect_toggle") {
          const turn = param === "on";
          await db.set(`${guild.id}.protectionEnabled`, turn);
          await btn.editReply({ content: `Koruma ${turn ? "açıldı" : "kapatıldı"}.`, ephemeral: true });
          // edit panel embed to reflect new state
          const newEmbed = buildPanelEmbed(guild, turn);
          const newRow = buildPanelRow(turn);
          await panelMsg.edit({ embeds: [newEmbed], components: [newRow, menu] }).catch(()=>{});
          return;
        }

        if (btn.customId === "lock_server") {
          // set verification very high and restrict @everyone send messages in default channels
          await db.set(`${guild.id}.locked`, true);
          // try set verification highest
          try { await guild.setVerificationLevel(4); } catch {}
          await btn.editReply({ content: "Sunucu kilitlendi (verification level yükseltildi).", ephemeral: true });
          const logC = await getLogChannel(guild);
          if (logC) logC.send({ embeds: [ new EmbedBuilder().setTitle("🔐 Sunucu Kilitlendi").setDescription(`Yetkili: ${btn.user.tag}`).setColor("Orange").setTimestamp() ] }).catch(()=>{});
          return;
        }

        if (btn.customId === "unlock_server") {
          await db.set(`${guild.id}.locked`, false);
          try { await guild.setVerificationLevel(1); } catch {}
          await btn.editReply({ content: "Sunucu kilidi kaldırıldı.", ephemeral: true });
          const logC = await getLogChannel(guild);
          if (logC) logC.send({ embeds: [ new EmbedBuilder().setTitle("🔓 Sunucu Kilidi Kaldırıldı").setDescription(`Yetkili: ${btn.user.tag}`).setColor("Green").setTimestamp() ] }).catch(()=>{});
          return;
        }

        if (btn.customId === "restore_roles") {
          // try to restore roles from rollback.json if available (quick attempt)
          const restore = require("../utils/restore");
          await restore.restoreRoles(guild).catch(()=>{});
          await btn.editReply({ content: "Restore (roller) başlatıldı.", ephemeral: true });
          const logC = await getLogChannel(guild);
          if (logC) logC.send({ embeds: [ new EmbedBuilder().setTitle("🔁 Restore Başlatıldı (Roller)").setDescription(`Yetkili: ${btn.user.tag}`).setColor("Blue").setTimestamp() ] }).catch(()=>{});
          return;
        }

        return btn.editReply({ content: "Bilinmeyen işlem.", ephemeral: true });
      } catch (e) {
        console.error("Panel button error:", e);
        return btn.editReply({ content: "İşlem sırasında hata oluştu.", ephemeral: true });
      }
    });

    // also listen select menu (different collector)
    const selectCollector = panelMsg.createMessageComponentCollector({ time: 1000 * 60 * 60, componentType: ComponentType.StringSelect });

    selectCollector.on("collect", async sel => {
      await sel.deferReply({ ephemeral: true });
      const member = await guild.members.fetch(sel.user.id).catch(()=>null);
      if (!member) return sel.editReply({ content: "Üye bulunamadı.", ephemeral: true });
      if (!(member.permissions.has(PermissionFlagsBits.Administrator) || (await db.get(`${guild.id}.adminRoleId`) && member.roles.cache.has(await db.get(`${guild.id}.adminRoleId`))))) {
        return sel.editReply({ content: "Bu paneli kullanmak için yetkiniz yok.", ephemeral: true });
      }

      const val = sel.values[0];
      if (val === "mass_timeout" || val === "mass_kick" || val === "mass_ban") {
        // expect user to mention users in the follow-up; request modal-like interaction via followup
        await sel.editReply({ content: `Lütfen komutu kullanırken hedef kullanıcı ID'lerini virgülle ayırarak gönder (örn: 123,456,789). Şimdi mesaj olarak ID listesi gönder.`, ephemeral: true });

        // create message collector to get IDs from same user
        const filter = m => m.author.id === sel.user.id;
        const channel = sel.channel;
        const msgCollector = channel.createMessageCollector({ filter, time: 30_000, max: 1 });

        msgCollector.on("collect", async m => {
          const raw = m.content.replace(/<@!?\d+>/g, s => s.replace(/[<@!>]/g, "").trim());
          // split by comma or spaces
          const ids = raw.split(/[\s,]+/).map(x => x.trim()).filter(Boolean);
          if (!ids.length) {
            await sel.followUp({ content: "Geçersiz giriş.", ephemeral: true });
            return;
          }
          await sel.followUp({ content: `İşlem başlatılıyor (${val}) -> ${ids.length} hedef`, ephemeral: true });
          for (const id of ids) {
            try {
              const target = await guild.members.fetch(id).catch(()=>null);
              if (!target) continue;
              if (val === "mass_timeout") {
                await target.timeout(15 * 60 * 1000, `Mass action by ${sel.user.tag}`).catch(()=>{});
              } else if (val === "mass_kick") {
                await target.kick(`Mass action by ${sel.user.tag}`).catch(()=>{});
              } else if (val === "mass_ban") {
                await guild.members.ban(id, { reason: `Mass action by ${sel.user.tag}` }).catch(()=>{});
              }
            } catch (e) {
              console.error("mass action error", e);
            }
          }
          const logC = await getLogChannel(guild);
          if (logC) logC.send({ embeds: [ new EmbedBuilder().setTitle("⚙️ Moderasyon Paneli İşlemi").setDescription(`Yetkili: ${sel.user.tag}\nİşlem: ${val}\nHedef sayısı: ${ids.length}`).setColor("Blue").setTimestamp() ] }).catch(()=>{});
        });

        msgCollector.on("end", collected => {
          if (collected.size === 0) sel.followUp({ content: "Süre doldu, işlem iptal edildi.", ephemeral: true });
        });

        return;
      }

      if (val === "toggle_protect") {
        const cur = await db.get(`${guild.id}.protectionEnabled`) ?? DEFAULTS.protectionEnabled;
        await db.set(`${guild.id}.protectionEnabled`, !cur);
        sel.editReply({ content: `Koruma ${!cur ? "açıldı" : "kapatıldı"}`, ephemeral: true });
        // update panel UI
        const newEmbed = buildPanelEmbed(guild, !cur);
        const newRow = buildPanelRow(!cur);
        await panelMsg.edit({ embeds: [newEmbed], components: [newRow, menu] }).catch(()=>{});
        return;
      }

      return sel.editReply({ content: "Bilinmeyen işlem.", ephemeral: true });
    });
  },

  // initEvents to register automatic protections / punishments
  async initEvents(client) {
    // ensure utils/restore exists; if not, many features degrade gracefully
    let restore;
    try { restore = require("../utils/restore"); } catch(e) { restore = null; }

    // helper to log to guild's log channel
    async function log(guild, embed) {
      const ch = await getLogChannel(guild);
      if (ch) ch.send({ embeds: [embed] }).catch(()=>{});
      else guild.systemChannel?.send({ embeds: [embed] }).catch(()=>{});
    }

    // CHANNEL DELETE protection
    client.on(Events.ChannelDelete, async (channel) => {
      try {
        const guild = channel.guild;
        const enabled = await db.get(`${guild.id}.protectionEnabled`) ?? DEFAULTS.protectionEnabled;
        if (!enabled) return;

        const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(()=>null);
        const entry = audit?.entries.first();
        if (!entry) return;
        const executor = entry.executor;
        if (!executor || executor.bot) return;

        // skip exempt
        const member = await guild.members.fetch(executor.id).catch(()=>null);
        if (!member) return;
        if (await isExempt(member)) return;

        // record count
        const count = addActionCount(guild.id, "channelDelete", executor.id, (await db.get(`${guild.id}.thresholds.massChannelDeleteWindowMs`)) || DEFAULTS.thresholds.massChannelDeleteWindowMs);
        const limit = (await db.get(`${guild.id}.thresholds.massChannelDeleteLimit`)) || DEFAULTS.thresholds.massChannelDeleteLimit;

        // take action depending on threshold
        const autoKind = (await db.get(`${guild.id}.autoPunish.massChannelDelete`)) || DEFAULTS.autoPunish.massChannelDelete;
        let actionResult = { ok: false };
        if (count >= limit) {
          actionResult = await applyPunish(guild, executor.id, autoKind, "Mass channel delete - auto protection");
        } else {
          // soft action: remove roles temporarily
          actionResult = await applyPunish(guild, executor.id, "removeroles", "Suspicious channel delete");
        }

        // log embed
        const embed = new EmbedBuilder()
          .setTitle("🔥 Kanal Silme Tespit Edildi")
          .setColor("Red")
          .setDescription(`Kanal: **${channel.name}**\nFail: <@${executor.id}> (${executor.tag})`)
          .addFields(
            { name: "Eylem", value: actionResult.ok ? (actionResult.action || "uygulandı") : "uygulama başarısız", inline: true },
            { name: "Sayac", value: `${count}/${limit}`, inline: true }
          )
          .setTimestamp();

        await log(guild, embed);

        // save snapshot & restore if utils available
        if (restore) {
          await restore.saveChannelSnapshot(channel).catch(()=>{});
          setTimeout(()=> restore.restoreChannels(guild).catch(()=>{}), 2000);
        }
      } catch (e) {
        console.error("channelDelete protection error:", e);
      }
    });

    // ROLE DELETE protection
    client.on(Events.GuildRoleDelete, async (role) => {
      try {
        const guild = role.guild;
        const enabled = await db.get(`${guild.id}.protectionEnabled`) ?? DEFAULTS.protectionEnabled;
        if (!enabled) return;

        const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(()=>null);
        const entry = audit?.entries.first();
        if (!entry) return;
        const executor = entry.executor;
        if (!executor || executor.bot) return;

        const member = await guild.members.fetch(executor.id).catch(()=>null);
        if (!member) return;
        if (await isExempt(member)) return;

        const count = addActionCount(guild.id, "roleDelete", executor.id, (await db.get(`${guild.id}.thresholds.massRoleDeleteWindowMs`)) || DEFAULTS.thresholds.massRoleDeleteWindowMs);
        const limit = (await db.get(`${guild.id}.thresholds.massRoleDeleteLimit`)) || DEFAULTS.thresholds.massRoleDeleteLimit;

        const autoKind = (await db.get(`${guild.id}.autoPunish.massRoleDelete`)) || DEFAULTS.autoPunish.massRoleDelete;
        let actionResult = { ok: false };
        if (count >= limit) {
          actionResult = await applyPunish(guild, executor.id, autoKind, "Mass role delete - auto protection");
        } else {
          actionResult = await applyPunish(guild, executor.id, "removeroles", "Suspicious role delete");
        }

        const embed = new EmbedBuilder()
          .setTitle("🔥 Rol Silme Tespit Edildi")
          .setColor("Red")
          .setDescription(`Rol: **${role.name}**\nFail: <@${executor.id}> (${executor.tag})`)
          .addFields(
            { name: "Eylem", value: actionResult.ok ? (actionResult.action || "uygulandı") : "uygulama başarısız", inline: true },
            { name: "Sayac", value: `${count}/${limit}`, inline: true }
          )
          .setTimestamp();

        await log(guild, embed);

        if (restore) {
          await restore.saveRoleSnapshot(role).catch(()=>{});
          setTimeout(()=> restore.restoreRoles(guild).catch(()=>{}), 2000);
        }
      } catch (e) {
        console.error("roleDelete protection error:", e);
      }
    });

    // MASS BAN protection
    client.on(Events.GuildBanAdd, async (guildOrGuild, user) => {
      try {
        const guild = guildOrGuild instanceof Object && guildOrGuild.id ? guildOrGuild : null;
        if (!guild) return;
        const enabled = await db.get(`${guild.id}.protectionEnabled`) ?? DEFAULTS.protectionEnabled;
        if (!enabled) return;

        const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(()=>null);
        const entry = audit?.entries.first();
        if (!entry) return;
        const executor = entry.executor;
        if (!executor || executor.bot) return;

        const member = await guild.members.fetch(executor.id).catch(()=>null);
        if (!member) return;
        if (await isExempt(member)) return;

        const count = addActionCount(guild.id, "ban", executor.id, (await db.get(`${guild.id}.thresholds.massBanWindowMs`)) || DEFAULTS.thresholds.massBanWindowMs);
        const limit = (await db.get(`${guild.id}.thresholds.massBanLimit`)) || DEFAULTS.thresholds.massBanLimit;

        const autoKind = (await db.get(`${guild.id}.autoPunish.massBan`)) || DEFAULTS.autoPunish.massBan;
        let actionResult = { ok: false };
        if (count >= limit) {
          actionResult = await applyPunish(guild, executor.id, autoKind, "Mass ban - auto protection");
        } else {
          actionResult = await applyPunish(guild, executor.id, "timeout", "Suspicious ban activity");
        }

        const embed = new EmbedBuilder()
          .setTitle("🚨 Toplu Ban Tespit Edildi")
          .setColor("DarkRed")
          .setDescription(`Fail: <@${executor.id}> (${executor.tag})\nAtılan kullanıcı: ${user.tag || user.id}`)
          .addFields(
            { name: "Eylem", value: actionResult.ok ? (actionResult.action || "uygulandı") : "uygulama başarısız", inline: true },
            { name: "Sayaç", value: `${count}/${limit}`, inline: true }
          )
          .setTimestamp();

        await log(guild, embed);
      } catch (e) {
        console.error("guildBanAdd protection error:", e);
      }
    });

    // ROLE UPDATE (dangerous permission grant)
    client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
      try {
        const guild = newRole.guild;
        const enabled = await db.get(`${guild.id}.protectionEnabled`) ?? DEFAULTS.protectionEnabled;
        if (!enabled) return;

        const dangerousPerms = [
          PermissionFlagsBits.Administrator,
          PermissionFlagsBits.ManageGuild,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.BanMembers,
        ];

        for (const p of dangerousPerms) {
          if (!oldRole.permissions.has(p) && newRole.permissions.has(p)) {
            // someone increased perms on role
            const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 }).catch(()=>null);
            const entry = audit?.entries.first();
            const executor = entry?.executor;
            if (!executor || executor.bot) return;
            const member = await guild.members.fetch(executor.id).catch(()=>null);
            if (!member) return;
            if (await isExempt(member)) return;

            // revert permissions
            await newRole.setPermissions(oldRole.permissions).catch(()=>{});
            // punish according to config
            const autoKind = (await db.get(`${guild.id}.autoPunish.dangerousPermGrant`)) || DEFAULTS.autoPunish.dangerousPermGrant;
            const actionResult = await applyPunish(guild, executor.id, autoKind, "Unauthorized permission grant - auto protection");

            const embed = new EmbedBuilder()
              .setTitle("🔱 Tehlikeli Yetki Denemesi Engellendi")
              .setColor("DarkRed")
              .setDescription(`Rol: **${newRole.name}**\nFail: <@${executor.id}> (${executor.tag})`)
              .addFields(
                { name: "Eylem", value: actionResult.ok ? (actionResult.action || "uygulandı") : "uygulama başarısız" }
              )
              .setTimestamp();

            await log(guild, embed);
            return;
          }
        }
      } catch (e) {
        console.error("roleUpdate protection error:", e);
      }
    });

    // BOT ADD protection (guildMemberAdd with bot)
    client.on(Events.GuildMemberAdd, async (member) => {
      try {
        const guild = member.guild;
        const enabled = await db.get(`${guild.id}.protectionEnabled`) ?? DEFAULTS.protectionEnabled;
        if (!enabled) return;
        if (!member.user.bot) return;

        const audit = await guild.fetchAuditLogs({ limit: 5 }).catch(()=>null);
        const entry = audit?.entries.find(e => e.targetId === member.user.id);
        const executor = entry?.executor;
        if (!executor || executor.bot) return;

        const execMember = await guild.members.fetch(executor.id).catch(()=>null);
        if (!execMember) return;
        if (await isExempt(execMember)) return;

        const autoKind = (await db.get(`${guild.id}.autoPunish.botAdd`)) || DEFAULTS.autoPunish.botAdd;
        const actionResult = await applyPunish(guild, executor.id, autoKind, "Unauthorized bot add - auto protection");

        const embed = new EmbedBuilder()
          .setTitle("🕳️ Şüpheli Bot Ekleme Tespit Edildi")
          .setColor("DarkRed")
          .setDescription(`Bot: <@${member.user.id}>\nEkleyen: <@${executor.id}> (${executor.tag})`)
          .addFields({ name: "Eylem", value: actionResult.ok ? (actionResult.action || "uygulandı") : "uygulama başarısız" })
          .setTimestamp();

        await log(guild, embed);
      } catch (e) {
        console.error("guildMemberAdd(bot) protection error:", e);
      }
    });

    // periodic cleanup for in-memory counters to avoid memory growth
    setInterval(() => {
      const now = Date.now();
      for (const [key, arr] of actionCounters) {
        // parse window ms from key? simplistic: clear arrays older than 5min references
        if (!arr.length) { actionCounters.delete(key); continue; }
        if (now - arr[arr.length - 1] > 5 * 60 * 1000) actionCounters.delete(key);
      }
    }, 60 * 1000);

    console.log("[MODPANEL] Protection events initialized.");
  }
};
