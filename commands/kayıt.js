const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  Events, 
  AuditLogEvent 
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("modlog")
    .setDescription("Moderasyon kayıt sistemini kurar")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName("kanal")
        .setDescription("Moderasyon kayıtlarının gönderileceği kanal")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel("kanal");

    await db.set(`modLog_${interaction.guild.id}`, channel.id);

    await interaction.reply({
      content: `Moderasyon kayıt kanalı başarıyla ${channel} olarak ayarlandı.`,
      ephemeral: true
    });

    // Eventler sadece 1 kez kurulacak
    if (client.modLogEventsSetup) return;
    client.modLogEventsSetup = true;

    // Ban kayıtları
    client.on(Events.GuildBanAdd, async ban => {
      const logChannelId = await db.get(`modLog_${ban.guild.id}`);
      if (!logChannelId) return;
      const logChannel = ban.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
      const log = logs.entries.first();
      const executor = log?.executor?.tag || "Bilinmiyor";

      logChannel.send(`Kullanıcı ${ban.user.tag} sunucudan yasaklandı. Yetkili: ${executor}`);
    });

    // Kick kayıtları
    client.on(Events.GuildMemberRemove, async member => {
      const logChannelId = await db.get(`modLog_${member.guild.id}`);
      if (!logChannelId) return;
      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
      const log = logs.entries.first();
      if (!log) return;

      const executor = log.executor.tag;
      logChannel.send(`Kullanıcı ${member.user.tag} sunucudan atıldı. Yetkili: ${executor}`);
    });

    // Rol ekleme / çıkarma kayıtları
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
      const logChannelId = await db.get(`modLog_${newMember.guild.id}`);
      if (!logChannelId) return;
      const logChannel = newMember.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

        if (added.size > 0) {
          logChannel.send(`Kullanıcı ${newMember.user.tag} şu rol(ler)i aldı: ${added.map(r => r.name).join(", ")}`);
        }

        if (removed.size > 0) {
          logChannel.send(`Kullanıcı ${newMember.user.tag} şu rol(ler)i kaybetti: ${removed.map(r => r.name).join(", ")}`);
        }
      }
    });
  }
};
