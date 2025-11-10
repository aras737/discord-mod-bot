const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  ChannelType, 
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Events,
  AttachmentBuilder
} = require("discord.js");
const { QuickDB } = require("quick.db");
const fetch = require("node-fetch");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bilet-sistemi")
    .setDescription("Gelişmiş bilet sistemi kurar")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName("kanal")
        .setDescription("Bilet sisteminin kurulacağı kanal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addRoleOption(option =>
      option.setName("destek-rolu")
        .setDescription("Biletleri görebilecek destek rolü")
        .setRequired(true))
    .addChannelOption(option =>
      option.setName("log-kanal")
        .setDescription("Bilet loglarının gönderileceği kanal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addChannelOption(option =>
      option.setName("kategori")
        .setDescription("Bilet kanallarının oluşturulacağı kategori")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false))
    .addStringOption(option =>
      option.setName("roblox-grup-id")
        .setDescription("Roblox grup ID'si")
        .setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmak için Yönetici yetkisine sahip olmalısınız.",
        ephemeral: true
      });
    }

    const existingTicket = await db.get(`user_ticket_${interaction.user.id}_${interaction.guild.id}`);
    if (existingTicket) {
      return interaction.reply({ 
        content: "❌ Zaten açık bir biletiniz var! Önce mevcut biletinizi kapatmalısınız.", 
        ephemeral: true 
      });
    }

    const targetChannel = interaction.options.getChannel("kanal");
    const supportRole = interaction.options.getRole("destek-rolu");
    const logChannel = interaction.options.getChannel("log-kanal");
    const category = interaction.options.getChannel("kategori");
    const robloxGroupId = interaction.options.getString("roblox-grup-id");

    await db.set(`ticket_support_role_${interaction.guild.id}`, supportRole.id);
    if (logChannel) await db.set(`ticket_log_channel_${interaction.guild.id}`, logChannel.id);
    if (category) await db.set(`ticket_category_${interaction.guild.id}`, category.id);
    if (robloxGroupId) await db.set(`roblox_group_id_${interaction.guild.id}`, robloxGroupId);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("ticket_type_select")
      .setPlaceholder("Bilet türünü seçin")
      .addOptions([
        new StringSelectMenuOptionBuilder().setLabel("Genel Destek").setDescription("Genel sorular ve destek").setValue("general_support"),
        new StringSelectMenuOptionBuilder().setLabel("Teknik Sorun").setDescription("Teknik problemler ve hatalar").setValue("technical_issue"),
        new StringSelectMenuOptionBuilder().setLabel("Şikayet").setDescription("Şikayet bildirmek için").setValue("complaint"),
        new StringSelectMenuOptionBuilder().setLabel("Diğer").setDescription("Diğer konular").setValue("other"),
        new StringSelectMenuOptionBuilder().setLabel("Transfer").setDescription("Transfer işlemleri için").setValue("transfer"),
      ]);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const ticketEmbed = new EmbedBuilder()
      .setTitle("Destek Bilet Sistemi")
      .setDescription(
        "Destek almak için aşağıdan uygun bilet türünü seçin.\n\n" +
        "**Notlar:**\n" +
        "• Sorununuzu ayrıntılı yazın.\n" +
        "• Gerekli görselleri ekleyin.\n" +
        "• Sabırlı olun, ekibimiz en kısa sürede cevap verecektir."
      )
      .setColor("#0099ff");

    await targetChannel.send({ embeds: [ticketEmbed], components: [selectRow] });
    await interaction.reply({ content: `Bilet sistemi başarıyla ${targetChannel} kanalında kuruldu.`, ephemeral: true });

    this.setupEventListeners(client);
  },

  async getRobloxGroupRoles(groupId) {
    try {
      const response = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/roles`);
      const data = await response.json();
      return data.roles || [];
    } catch (error) {
      console.error('Roblox grup rolleri alınamadı:', error);
      return [];
    }
  },

  // 🔹 TRANSCRIPT OLUŞTURMA FONKSİYONU
  async createTranscript(channel) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const sortedMessages = Array.from(messages.values()).reverse();

      let html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bilet Transkripti - ${channel.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background: #36393f;
            color: #dcddde;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #2f3136;
            border-radius: 8px;
            padding: 20px;
        }
        .header {
            background: #202225;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #fff;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .header p {
            color: #b9bbbe;
            font-size: 14px;
        }
        .message {
            display: flex;
            padding: 15px 10px;
            border-bottom: 1px solid #202225;
            transition: background 0.2s;
        }
        .message:hover {
            background: #32353b;
        }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .message-content {
            flex: 1;
        }
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        .username {
            color: #fff;
            font-weight: 600;
            margin-right: 8px;
        }
        .timestamp {
            color: #72767d;
            font-size: 12px;
        }
        .message-text {
            color: #dcddde;
            line-height: 1.375;
            word-wrap: break-word;
        }
        .attachment {
            margin-top: 10px;
            max-width: 400px;
        }
        .attachment img {
            max-width: 100%;
            border-radius: 4px;
        }
        .embed {
            background: #2f3136;
            border-left: 4px solid #5865f2;
            padding: 12px;
            margin-top: 8px;
            border-radius: 4px;
        }
        .embed-title {
            color: #fff;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .embed-description {
            color: #dcddde;
        }
        .bot-tag {
            background: #5865f2;
            color: #fff;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 3px;
            margin-left: 5px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Bilet Transkripti</h1>
            <p><strong>Kanal:</strong> #${channel.name}</p>
            <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
            <p><strong>Toplam Mesaj:</strong> ${sortedMessages.length}</p>
        </div>
        <div class="messages">`;

      for (const msg of sortedMessages) {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString('tr-TR');
        const avatar = msg.author.displayAvatarURL({ extension: 'png', size: 128 });
        const botTag = msg.author.bot ? '<span class="bot-tag">BOT</span>' : '';

        html += `
            <div class="message">
                <img class="avatar" src="${avatar}" alt="${msg.author.username}">
                <div class="message-content">
                    <div class="message-header">
                        <span class="username">${msg.author.username}</span>
                        ${botTag}
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="message-text">${msg.content || '<em>Mesaj içeriği yok</em>'}</div>`;

        // Eklentiler (resimler, dosyalar)
        if (msg.attachments.size > 0) {
          msg.attachments.forEach(attachment => {
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
              html += `<div class="attachment"><img src="${attachment.url}" alt="Ek"></div>`;
            } else {
              html += `<div class="attachment"><a href="${attachment.url}" target="_blank">📎 ${attachment.name}</a></div>`;
            }
          });
        }

        // Embedler
        if (msg.embeds.length > 0) {
          msg.embeds.forEach(embed => {
            html += `
                <div class="embed">
                    ${embed.title ? `<div class="embed-title">${embed.title}</div>` : ''}
                    ${embed.description ? `<div class="embed-description">${embed.description}</div>` : ''}
                </div>`;
          });
        }

        html += `
                </div>
            </div>`;
      }

      html += `
        </div>
    </div>
</body>
</html>`;

      return Buffer.from(html, 'utf-8');
    } catch (error) {
      console.error('Transcript oluşturulurken hata:', error);
      return null;
    }
  },

  setupEventListeners(client) {
    if (client.ticketEventsSetup) return;
    client.ticketEventsSetup = true;

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

      const logChannelId = await db.get(`ticket_log_channel_${interaction.guild.id}`);
      const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;
      const robloxGroupId = await db.get(`roblox_group_id_${interaction.guild.id}`);

      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type_select') {
        const ticketType = interaction.values[0];
        const supportRoleId = await db.get(`ticket_support_role_${interaction.guild.id}`);
        const categoryId = await db.get(`ticket_category_${interaction.guild.id}`);

        const ticketTypes = {
          general_support: { name: "genel-destek", description: "Genel Destek" },
          technical_issue: { name: "teknik-sorun", description: "Teknik Sorun" },
          complaint: { name: "sikayet", description: "Şikayet" },
          other: { name: "diger", description: "Diğer" },
          transfer: { name: "transfer", description: "Transfer" }
        };

        const selectedType = ticketTypes[ticketType];
        const ticketNumber = Date.now().toString().slice(-6);

        const ticketChannel = await interaction.guild.channels.create({
          name: `${selectedType.name}-${interaction.user.username}-${ticketNumber}`,
          type: ChannelType.GuildText,
          parent: categoryId || null,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          ]
        });

        await db.set(`user_ticket_${interaction.user.id}_${interaction.guild.id}`, ticketChannel.id);
        await db.set(`ticket_info_${ticketChannel.id}`, {
          userId: interaction.user.id,
          type: ticketType,
          createdAt: Date.now(),
          status: 'open',
          claimedBy: null,
          supportRole: supportRoleId,
          selectedRobloxRole: null
        });

        const ticketButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('close_ticket').setLabel('Bileti Kapat').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('claim_ticket').setLabel('Bileti Üstlen').setStyle(ButtonStyle.Primary)
        );

        const components = [ticketButtons];
        const embedColor = ticketType === "transfer" ? "Orange" : "Green";
        const embedDescription = "Sorununuzu buraya yazın.";

        await ticketChannel.send({
          content: `${interaction.user} <@&${supportRoleId}>`,
          embeds: [new EmbedBuilder().setTitle(`${selectedType.description} Bileti`).setDescription(embedDescription).setColor(embedColor)],
          components: components
        });

        await interaction.reply({ content: `${selectedType.description} biletiniz açıldı: ${ticketChannel}`, ephemeral: true });

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Yeni Bilet Açıldı")
            .addFields(
              { name: "Kullanıcı", value: `${interaction.user.tag}`, inline: true },
              { name: "Tür", value: selectedType.description, inline: true },
              { name: "Kanal", value: `${ticketChannel}`, inline: true }
            )
            .setColor(ticketType === "transfer" ? "Orange" : "Blue")
            .setTimestamp();
          logChannel.send({ embeds: [logEmbed] });
        }
      }

      // 🔹 BİLET KAPATMA VE TRANSCRIPT GÖNDERME
      if (interaction.isButton() && interaction.customId === "close_ticket") {
        const ticketInfo = await db.get(`ticket_info_${interaction.channel.id}`);
        if (!ticketInfo) return interaction.reply({ content: "Bilet bilgisi bulunamadı.", ephemeral: true });

        await interaction.reply({ content: "📝 Bilet kapatılıyor, transcript oluşturuluyor...", ephemeral: false });

        // 🔹 TRANSCRIPT OLUŞTUR
        const transcriptBuffer = await this.createTranscript(interaction.channel);

        if (logChannel && transcriptBuffer) {
          const attachment = new AttachmentBuilder(transcriptBuffer, { 
            name: `transcript-${interaction.channel.name}-${Date.now()}.html` 
          });

          const logEmbed = new EmbedBuilder()
            .setTitle("📋 Bilet Kapatıldı")
            .addFields(
              { name: "Kanal", value: `${interaction.channel.name}`, inline: true },
              { name: "Kapatan", value: `${interaction.user.tag}`, inline: true },
              { name: "Kullanıcı", value: `<@${ticketInfo.userId}>`, inline: true },
              { name: "Üstlenen", value: ticketInfo.claimedBy ? `<@${ticketInfo.claimedBy}>` : "Yok", inline: true },
              { name: "Oluşturulma", value: `<t:${Math.floor(ticketInfo.createdAt / 1000)}:R>`, inline: true }
            )
            .setColor("Red")
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed], files: [attachment] });
        }

        await db.delete(`user_ticket_${ticketInfo.userId}_${interaction.guild.id}`);
        await db.delete(`ticket_info_${interaction.channel.id}`);

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }

      if (interaction.isButton() && interaction.customId === "claim_ticket") {
        const ticketInfo = await db.get(`ticket_info_${interaction.channel.id}`);
        if (!ticketInfo) return interaction.reply({ content: "Bilet bilgisi bulunamadı.", ephemeral: true });

        if (ticketInfo.claimedBy) return interaction.reply({ content: "Bilet zaten üstlenilmiş.", ephemeral: true });

        ticketInfo.claimedBy = interaction.user.id;
        await db.set(`ticket_info_${interaction.channel.id}`, ticketInfo);

        await interaction.reply({ content: `Bu bilet ${interaction.user.tag} tarafından üstlenildi.`, ephemeral: false });

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Bilet Üstlenildi")
            .addFields(
              { name: "Kanal", value: `${interaction.channel}`, inline: true },
              { name: "Üstlenen", value: `${interaction.user.tag}`, inline: true }
            )
            .setColor("Green")
            .setTimestamp();
          logChannel.send({ embeds: [logEmbed] });
        }
      }
    });
  }
};
