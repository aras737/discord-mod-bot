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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // 🔹 Sadece adminler kullanabilir
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
    // 🔹 Yetki kontrolü
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmak için Yönetici yetkisine sahip olmalısınız.",
        ephemeral: true
      });
    }

    // 🔹 Mevcut bilet kontrolü
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

    // 🔹 Eventleri kur
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

  setupEventListeners(client) {
    if (client.ticketEventsSetup) return; // Tekrar kurmamak için
    client.ticketEventsSetup = true;

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

      const logChannelId = await db.get(`ticket_log_channel_${interaction.guild.id}`);
      const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;
      const robloxGroupId = await db.get(`roblox_group_id_${interaction.guild.id}`);

      // 🔹 Bilet türü seçildiğinde
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

        // 🔹 Kullanıcıya açık bilet var olarak kaydet
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

        // 🔹 Bilet mesajı ve button
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

        // 🔹 Log
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

      // 🔹 Bilet kapatma butonu
      if (interaction.isButton() && interaction.customId === "close_ticket") {
        const ticketInfo = await db.get(`ticket_info_${interaction.channel.id}`);
        if (!ticketInfo) return interaction.reply({ content: "Bilet bilgisi bulunamadı.", ephemeral: true });

        await db.delete(`user_ticket_${ticketInfo.userId}_${interaction.guild.id}`);
        await db.delete(`ticket_info_${interaction.channel.id}`);

        await interaction.reply({ content: "Bilet kapatılıyor, kanal 5 saniye içinde silinecek.", ephemeral: false });

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Bilet Kapatıldı")
            .addFields(
              { name: "Kapatılan Kanal", value: `${interaction.channel.name}`, inline: true },
              { name: "Kapatan Yetkili", value: `${interaction.user.tag}`, inline: true }
            )
            .setColor("Red")
            .setTimestamp();
          logChannel.send({ embeds: [logEmbed] });
        }

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }

      // 🔹 Bilet üstlenme
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
