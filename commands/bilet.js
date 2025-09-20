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
const db = require("quick.db");

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

    // Veritabanına ayarları kaydet
    db.set(`ticket_support_role_${interaction.guild.id}`, supportRole.id);
    if (logChannel) db.set(`ticket_log_channel_${interaction.guild.id}`, logChannel.id);
    if (category) db.set(`ticket_category_${interaction.guild.id}`, category.id);

    // Bilet türü seçim menüsü
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
    // Eğer event listener zaten kurulmuşsa tekrar kurma
    if (client.ticketEventsSetup) return;
    client.ticketEventsSetup = true;

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

      // Bilet türü seçimi
      if (interaction.customId === 'ticket_type_select') {
        const ticketType = interaction.values[0];
        const supportRoleId = db.get(`ticket_support_role_${interaction.guild.id}`);
        const categoryId = db.get(`ticket_category_${interaction.guild.id}`);
        const logChannelId = db.get(`ticket_log_channel_${interaction.guild.id}`);

        // Kullanıcının açık bileti var mı kontrol et
        const existingTicket = db.get(`user_ticket_${interaction.user.id}_${interaction.guild.id}`);
        if (existingTicket) {
          const channel = interaction.guild.channels.cache.get(existingTicket);
          if (channel) {
            return interaction.reply({
              content: `Zaten açık bir biletiniz bulunmaktadır: ${channel}`,
              ephemeral: true
            });
          } else {
            // Kanal silinmişse veritabanından temizle
            db.delete(`user_ticket_${interaction.user.id}_${interaction.guild.id}`);
          }
        }

        // Bilet türüne göre isim ve açıklama
        const ticketTypes = {
          general_support: { name: "genel-destek", description: "Genel Destek" },
          technical_issue: { name: "teknik-sorun", description: "Teknik Sorun" },
          complaint: { name: "sikayet", description: "Şikayet" },
          other: { name: "diger", description: "Diğer" }
        };

        const selectedType = ticketTypes[ticketType];
        const ticketNumber = Date.now().toString().slice(-6);

        try {
          // Bilet kanalı oluştur
          const ticketChannel = await interaction.guild.channels.create({
            name: `${selectedType.name}-${interaction.user.username}-${ticketNumber}`,
            type: ChannelType.GuildText,
            parent: categoryId || null,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: interaction.user.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.EmbedLinks
                ]
              },
              {
                id: supportRoleId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.EmbedLinks,
                  PermissionFlagsBits.ManageMessages
                ]
              }
            ]
          });

          // Veritabanına kaydet
          db.set(`user_ticket_${interaction.user.id}_${interaction.guild.id}`, ticketChannel.id);
          db.set(`ticket_info_${ticketChannel.id}`, {
            userId: interaction.user.id,
            type: ticketType,
            createdAt: Date.now(),
            status: 'open',
            claimedBy: null
          });

          // Bilet kontrol butonları
          const ticketButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('close_ticket')
              .setLabel('Bileti Kapat')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('claim_ticket')
              .setLabel('Bileti Üstlen')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('add_user_ticket')
              .setLabel('Kullanıcı Ekle')
              .setStyle(ButtonStyle.Secondary)
          );

          // Bilet açılış mesajı
          const ticketOpenEmbed = new EmbedBuilder()
            .setTitle(`${selectedType.description} Bileti`)
            .setDescription(
              `Merhaba ${interaction.user}, biletiniz başarıyla oluşturuldu.\n\n` +
              `**Bilet Türü:** ${selectedType.description}\n` +
              `**Bilet Numarası:** #${ticketNumber}\n` +
              `**Oluşturulma Tarihi:** ${new Date().toLocaleString('tr-TR')}\n\n` +
              `Lütfen sorununuzu detaylı bir şekilde açıklayın. Destek ekibimiz en kısa sürede size yardımcı olacaktır.\n\n` +
              `**Not:** Bu bilet sadece size ve destek ekibine görünmektedir.`
            )
            .setColor('#00ff00')
            .setFooter({ text: 'Bileti yönetmek için aşağıdaki butonları kullanın' })
            .setTimestamp();

          await ticketChannel.send({
            content: `${interaction.user} <@&${supportRoleId}>`,
            embeds: [ticketOpenEmbed],
            components: [ticketButtons]
          });

          // Log gönder
          if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setTitle('Yeni Bilet Açıldı')
                .addFields(
                  { name: 'Kullanıcı', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                  { name: 'Bilet Türü', value: selectedType.description, inline: true },
                  { name: 'Kanal', value: `${ticketChannel}`, inline: true },
                  { name: 'Bilet Numarası', value: `#${ticketNumber}`, inline: true },
                  { name: 'Oluşturulma Tarihi', value: new Date().toLocaleString('tr-TR'), inline: true }
                )
                .setColor('#0099ff')
                .setTimestamp();

              await logChannel.send({ embeds: [logEmbed] });
            }
          }

          await interaction.reply({
            content: `Biletiniz başarıyla oluşturuldu: ${ticketChannel}`,
            ephemeral: true
          });

        } catch (error) {
          console.error('Bilet oluşturma hatası:', error);
          await interaction.reply({
            content: 'Bilet oluşturulurken bir hata oluştu. Lütfen yöneticilerle iletişime geçin.',
            ephemeral: true
          });
        }
      }

      // Bilet kapatma
      if (interaction.customId === 'close_ticket') {
        const ticketInfo = db.get(`ticket_info_${interaction.channel.id}`);
        if (!ticketInfo) {
          return interaction.reply({
            content: 'Bu kanal için bilet bilgisi bulunamadı.',
            ephemeral: true
          });
        }

        const supportRoleId = db.get(`ticket_support_role_${interaction.guild.id}`);
        const hasPermission = interaction.member.roles.cache.has(supportRoleId) || 
                             interaction.user.id === ticketInfo.userId ||
                             interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
          return interaction.reply({
            content: 'Bu bileti kapatma yetkiniz bulunmamaktadır.',
            ephemeral: true
          });
        }

        // Onay butonları
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confirm_close')
            .setLabel('Evet, Kapat')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('cancel_close')
            .setLabel('İptal')
            .setStyle(ButtonStyle.Secondary)
        );

        const confirmEmbed = new EmbedBuilder()
          .setTitle('Bilet Kapatma Onayı')
          .setDescription('Bu bileti kapatmak istediğinizden emin misiniz? Bu işlem geri alınamaz.')
          .setColor('#ff9900')
          .setTimestamp();

        await interaction.reply({
          embeds: [confirmEmbed],
          components: [confirmRow],
          ephemeral: true
        });
      }

      // Bilet kapatma onayı
      if (interaction.customId === 'confirm_close') {
        const ticketInfo = db.get(`ticket_info_${interaction.channel.id}`);
        const logChannelId = db.get(`ticket_log_channel_${interaction.guild.id}`);

        // Veritabanından temizle
        db.delete(`user_ticket_${ticketInfo.userId}_${interaction.guild.id}`);
        db.delete(`ticket_info_${interaction.channel.id}`);

        // Log gönder
        if (logChannelId) {
          const logChannel = interaction.guild.channels.cache.get(logChannelId);
          if (logChannel) {
            try {
              const user = await interaction.client.users.fetch(ticketInfo.userId);
              const claimedByUser = ticketInfo.claimedBy ? await interaction.client.users.fetch(ticketInfo.claimedBy) : null;
              
              const logEmbed = new EmbedBuilder()
                .setTitle('Bilet Kapatıldı')
                .addFields(
                  { name: 'Bilet Sahibi', value: `${user.tag} (${user.id})`, inline: true },
                  { name: 'Kapatan Kişi', value: `${interaction.user.tag}`, inline: true },
                  { name: 'Üstlenen Kişi', value: claimedByUser ? claimedByUser.tag : 'Kimse', inline: true },
                  { name: 'Kanal Adı', value: interaction.channel.name, inline: true },
                  { name: 'Açılma Tarihi', value: new Date(ticketInfo.createdAt).toLocaleString('tr-TR'), inline: true },
                  { name: 'Kapanma Tarihi', value: new Date().toLocaleString('tr-TR'), inline: true }
                )
                .setColor('#ff0000')
                .setTimestamp();

              await logChannel.send({ embeds: [logEmbed] });
            } catch (error) {
              console.error('Log gönderme hatası:', error);
            }
          }
        }

        const closingEmbed = new EmbedBuilder()
          .setTitle('Bilet Kapatılıyor')
          .setDescription('Bu bilet 5 saniye içinde kapatılacaktır...')
          .setColor('#ff0000')
          .setTimestamp();

        await interaction.update({
          embeds: [closingEmbed],
          components: []
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete();
          } catch (error) {
            console.error('Kanal silme hatası:', error);
          }
        }, 5000);
      }

      // Bilet kapatma iptali
      if (interaction.customId === 'cancel_close') {
        await interaction.update({
          content: 'Bilet kapatma işlemi iptal edildi.',
          embeds: [],
          components: []
        });
      }

      // Bilet üstlenme
      if (interaction.customId === 'claim_ticket') {
        const supportRoleId = db.get(`ticket_support_role_${interaction.guild.id}`);
        
        if (!interaction.member.roles.cache.has(supportRoleId) && 
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: 'Bu bileti üstlenme yetkiniz bulunmamaktadır.',
            ephemeral: true
          });
        }

        const ticketInfo = db.get(`ticket_info_${interaction.channel.id}`);
        if (ticketInfo.claimedBy) {
          const claimedUser = await interaction.client.users.fetch(ticketInfo.claimedBy);
          return interaction.reply({
            content: `Bu bilet zaten ${claimedUser.tag} tarafından üstlenilmiş.`,
            ephemeral: true
          });
        }

        // Bileti üstlen
        ticketInfo.claimedBy = interaction.user.id;
        db.set(`ticket_info_${interaction.channel.id}`, ticketInfo);

        const claimEmbed = new EmbedBuilder()
          .setTitle('Bilet Üstlenildi')
          .setDescription(`Bu bilet ${interaction.user} tarafından üstlenildi.`)
          .setColor('#ffff00')
          .setTimestamp();

        await interaction.reply({ embeds: [claimEmbed] });
      }

      // Kullanıcı ekleme (basit implementasyon)
      if (interaction.customId === 'add_user_ticket') {
        const supportRoleId = db.get(`ticket_support_role_${interaction.guild.id}`);
        
        if (!interaction.member.roles.cache.has(supportRoleId) && 
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: 'Bu özelliği kullanma yetkiniz bulunmamaktadır.',
            ephemeral: true
          });
        }

        await interaction.reply({
          content: 'Kullanıcı ekleme özelliği için kullanıcıyı etiketleyerek kanalda belirtin.',
          ephemeral: true
        });
      }
    });

    // Bilet kanallarındaki mesajları logla
    client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      if (!message.channel.name.includes('-')) return;
      
      const ticketInfo = db.get(`ticket_info_${message.channel.id}`);
      if (!ticketInfo) return;

      const logChannelId = db.get(`ticket_log_channel_${message.guild.id}`);
      if (!logChannelId) return;

      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      // Sadece önemli mesajları logla (çok spam olmaması için)
      if (message.content.length < 10 && message.attachments.size === 0) return;

      const messageLogEmbed = new EmbedBuilder()
        .setTitle('Bilet Mesaj Logu')
        .addFields(
          { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
          { name: 'Kanal', value: `${message.channel.name}`, inline: true },
          { name: 'Mesaj', value: message.content.slice(0, 1000) || '[Dosya/Medya]', inline: false }
        )
        .setColor('#00ffff')
        .setTimestamp();

      if (message.attachments.size > 0) {
        messageLogEmbed.addFields({
          name: 'Ekler',
          value: message.attachments.map(att => att.name).join(', '),
          inline: false
        });
      }

      try {
        await logChannel.send({ embeds: [messageLogEmbed] });
      } catch (error) {
        console.error('Mesaj log hatası:', error);
      }
    });
  }
};
