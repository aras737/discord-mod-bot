const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  Events, 
  AuditLogEvent, 
  EmbedBuilder 
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("modlog")
    .setDescription("Moderasyon kayıt sistemini kurar ve detaylı logları tutar.")
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

    // Eventler yalnızca 1 kez kurulacak
    if (client.modLogEventsSetup) return;
    client.modLogEventsSetup = true;

    // 🔹 Ban kayıtları
    client.on(Events.GuildBanAdd, async ban => {
      const logChannelId = await db.get(`modLog_${ban.guild.id}`);
      if (!logChannelId) return;
      const logChannel = ban.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
      const log = logs.entries.first();
      const executor = log?.executor?.tag || "Bilinmiyor";

      const embed = new EmbedBuilder()
        .setTitle("Kullanıcı Yasaklandı")
        .addFields(
          { name: "Kullanıcı", value: ban.user.tag, inline: true },
          { name: "Yetkili", value: executor, inline: true }
        )
        .setColor("Red")
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    });

    // 🔹 Kick kayıtları
    client.on(Events.GuildMemberRemove, async member => {
      const logChannelId = await db.get(`modLog_${member.guild.id}`);
      if (!logChannelId) return;
      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
      const log = logs.entries.first();
      if (!log) return;

      const executor = log.executor?.tag || "Bilinmiyor";

      const embed = new EmbedBuilder()
        .setTitle("Kullanıcı Atıldı")
        .addFields(
          { name: "Kullanıcı", value: member.user.tag, inline: true },
          { name: "Yetkili", value: executor, inline: true }
        )
        .setColor("Orange")
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    });

    // 🔹 Rol ekleme / çıkarma
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
      const logChannelId = await db.get(`modLog_${newMember.guild.id}`);
      if (!logChannelId) return;
      const logChannel = newMember.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
      const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

      if (added.size > 0) {
        const embed = new EmbedBuilder()
          .setTitle("Rol Eklendi")
          .setDescription(`${newMember.user.tag} kullanıcısına rol(ler) eklendi.`)
          .addFields({ name: "Roller", value: added.map(r => r.name).join(", ") })
          .setColor("Green")
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }

      if (removed.size > 0) {
        const embed = new EmbedBuilder()
          .setTitle("Rol Çıkarıldı")
          .setDescription(`${newMember.user.tag} kullanıcısından rol(ler) çıkarıldı.`)
          .addFields({ name: "Roller", value: removed.map(r => r.name).join(", ") })
          .setColor("Yellow")
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }
    });

    // 🔹 Kullanıcı adı değişiklikleri
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
      const logChannelId = await db.get(`modLog_${newMember.guild.id}`);
      if (!logChannelId) return;
      const logChannel = newMember.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      if (oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder()
          .setTitle("Kullanıcı Nick Değişikliği")
          .addFields(
            { name: "Kullanıcı", value: newMember.user.tag, inline: true },
            { name: "Eski Nick", value: oldMember.nickname || "Yok", inline: true },
            { name: "Yeni Nick", value: newMember.nickname || "Yok", inline: true }
          )
          .setColor("Blue")
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }

      if (oldMember.user.username !== newMember.user.username) {
        const embed = new EmbedBuilder()
          .setTitle("Kullanıcı Adı Değişikliği")
          .addFields(
            { name: "Eski Ad", value: oldMember.user.username, inline: true },
            { name: "Yeni Ad", value: newMember.user.username, inline: true }
          )
          .setColor("Blue")
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }
    });

    // 🔹 Kanal oluşturma / silme kayıtları
    client.on(Events.ChannelCreate, async channel => {
      const logChannelId = await db.get(`modLog_${channel.guild.id}`);
      if (!logChannelId) return;
      const logChannel = channel.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setTitle("Kanal Oluşturuldu")
        .addFields({ name: "Kanal", value: channel.name })
        .setColor("Green")
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    });

    client.on(Events.ChannelDelete, async channel => {
      const logChannelId = await db.get(`modLog_${channel.guild.id}`);
      if (!logChannelId) return;
      const logChannel = channel.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setTitle("Kanal Silindi")
        .addFields({ name: "Kanal", value: channel.name })
        .setColor("Red")
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    });
  }
};
