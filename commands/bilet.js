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
  Events
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bilet-sistemi")
    .setDescription("Gelişmiş bilet sistemi kurar")
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
        .setRequired(false)),

  async execute(interaction, client) {
    const targetChannel = interaction.options.getChannel("kanal");
    const supportRole = interaction.options.getRole("destek-rolu");
    const logChannel = interaction.options.getChannel("log-kanal");
    const category = interaction.options.getChannel("kategori");

    // ✅ Veritabanına ayarları kaydet (await ile)
    await db.set(`ticket_support_role_${interaction.guild.id}`, supportRole.id);
    if (logChannel) await db.set(`ticket_log_channel_${interaction.guild.id}`, logChannel.id);
    if (category) await db.set(`ticket_category_${interaction.guild.id}`, category.id);

    // Menü
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("ticket_type_select")
      .setPlaceholder("Bilet türünü seçin")
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel("Genel Destek")
          .setDescription("Genel sorular ve destek talebi")
          .setValue("general_support"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Teknik Sorun")
          .setDescription("Teknik problemler ve hatalar")
          .setValue("technical_issue"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Şikayet")
          .setDescription("Şikayet ve öneri bildirimi")
          .setValue("complaint"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Diğer")
          .setDescription("Diğer konular")
          .setValue("other")
      ]);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const ticketEmbed = new EmbedBuilder()
      .setTitle("Destek Bilet Sistemi")
      .setDescription(
        "Merhaba! Destek ekibimizden yardım almak için aşağıdan uygun bilet türünü seçin.\n\n" +
        "**Bilet Açmadan Önce:**\n" +
        "• Sorununuzu açık ve detaylı bir şekilde açıklayın\n" +
        "• Gerekli ekran görüntülerini hazırlayın\n" +
        "• Sabırlı olun, ekibimiz en kısa sürede size dönüş yapacaktır\n\n" +
        "**Destek Saatleri:** 09:00 - 22:00"
      )
      .setColor("#0099ff")
      .setFooter({ text: "Destek ekibi size yardımcı olmaktan mutluluk duyar" })
      .setTimestamp();

    try {
      await targetChannel.send({
        embeds: [ticketEmbed],
        components: [selectRow]
      });

      await interaction.reply({
        content: `Bilet sistemi başarıyla ${targetChannel} kanalında kuruldu.`,
        ephemeral: true
      });

      // Event listener'ları kur
      this.setupEventListeners(client);

    } catch (error) {
      console.error("Bilet sistemi kurulum hatası:", error);
      await interaction.reply({
        content: "Bilet sistemi kurulurken bir hata oluştu. Kanal izinlerini kontrol edin.",
        ephemeral: true
      });
    }
  },

  setupEventListeners(client) {
    if (client.ticketEventsSetup) return;
    client.ticketEventsSetup = true;

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

      // Bilet seçme
      if (interaction.customId === 'ticket_type_select') {
        const ticketType = interaction.values[0];
        const supportRoleId = await db.get(`ticket_support_role_${interaction.guild.id}`);
        const categoryId = await db.get(`ticket_category_${interaction.guild.id}`);
        const logChannelId = await db.get(`ticket_log_channel_${interaction.guild.id}`);

        // Zaten açık bilet var mı kontrol et
        const existingTicket = await db.get(`user_ticket_${interaction.user.id}_${interaction.guild.id}`);
        if (existingTicket) {
          const channel = interaction.guild.channels.cache.get(existingTicket);
          if (channel) {
            return interaction.reply({
              content: `Zaten açık bir biletiniz bulunmaktadır: ${channel}`,
              ephemeral: true
            });
          } else {
            await db.delete(`user_ticket_${interaction.user.id}_${interaction.guild.id}`);
          }
        }

        const ticketTypes = {
          general_support: { name: "genel-destek", description: "Genel Destek" },
          technical_issue: { name: "teknik-sorun", description: "Teknik Sorun" },
          complaint: { name: "sikayet", description: "Şikayet" },
          other: { name: "diger", description: "Diğer" }
        };

        const selectedType = ticketTypes[ticketType];
        const ticketNumber = Date.now().toString().slice(-6);

        try {
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
            claimedBy: null
          });

          const ticketButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Bileti Kapat').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Bileti Üstlen').setStyle(ButtonStyle.Success)
          );

          await ticketChannel.send({
            content: `${interaction.user} <@&${supportRoleId}>`,
            embeds: [new EmbedBuilder().setTitle(`${selectedType.description} Bileti`).setDescription("Sorununuzu yazın.")],
            components: [ticketButtons]
          });

          await interaction.reply({
            content: `Biletiniz başarıyla oluşturuldu: ${ticketChannel}`,
            ephemeral: true
          });

        } catch (error) {
          console.error('Bilet oluşturma hatası:', error);
          await interaction.reply({ content: 'Bilet oluşturulamadı.', ephemeral: true });
        }
      }
    });
  }
};
