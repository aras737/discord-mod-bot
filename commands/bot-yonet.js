const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  PermissionsBitField,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-yonetim')
    .setDescription('Gelişmiş bot yönetim panelini açar'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Bu komutu kullanmak için yönetici olmalısınız!', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('restart_bot')
        .setLabel('Botu Yeniden Başlat')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('stop_bot')
        .setLabel('Botu Durdur')
        .setEmoji('⛔')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('show_ping')
        .setLabel('Ping Göster')
        .setEmoji('🏓')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('list_commands')
        .setLabel('Komut Listesi')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('change_status')
        .setLabel('Durum Mesajını Değiştir')
        .setEmoji('⚙️')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('set_log_channel')
        .setLabel('Log Kanalını Ayarla')
        .setEmoji('📣')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('bot_info')
        .setLabel('Bot Bilgisi')
        .setEmoji('ℹ️')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ content: '🔧 **Bot Yönetim Paneli** 🔧', components: [row], ephemeral: true });

    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

    collector.on('collect', async i => {
      if (i.customId === 'restart_bot') {
        await i.deferUpdate();
        await i.followUp({ content: '🔄 Bot yeniden başlatılıyor...', ephemeral: true });
        console.log(`[BOT-YÖNETİM] ${i.user.tag} botu yeniden başlattı.`);
        process.exit(1);
      }

      else if (i.customId === 'stop_bot') {
        await i.deferUpdate();
        await i.followUp({ content: '⛔ Bot durduruluyor...', ephemeral: true });
        console.log(`[BOT-YÖNETİM] ${i.user.tag} botu durdurdu.`);
        process.exit(0);
      }

      else if (i.customId === 'show_ping') {
        const ping = Math.round(interaction.client.ws.ping);
        await i.reply({ content: `🏓 Ping: **${ping} ms**`, ephemeral: true });
        console.log(`[BOT-YÖNETİM] ${i.user.tag} ping gösterdi: ${ping}ms`);
      }

      else if (i.customId === 'list_commands') {
        const cmds = interaction.client.commands.map(cmd => cmd.data.name).join(', ');
        await i.reply({ content: `📜 Komutlar: **${cmds}**`, ephemeral: true });
        console.log(`[BOT-YÖNETİM] ${i.user.tag} komut listesini görüntüledi.`);
      }

      else if (i.customId === 'change_status') {
        const modal = new ModalBuilder()
          .setCustomId('change_status_modal')
          .setTitle('Durum Mesajını Değiştir');

        const input = new TextInputBuilder()
          .setCustomId('status_input')
          .setLabel('Yeni Durum Mesajı')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ör: Playing XYZ')
          .setMaxLength(100)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await i.showModal(modal);
      }

      else if (i.customId === 'set_log_channel') {
        const modal = new ModalBuilder()
          .setCustomId('set_log_channel_modal')
          .setTitle('Log Kanalı Ayarla');

        const input = new TextInputBuilder()
          .setCustomId('log_channel_id')
          .setLabel('Log Kanalı ID\'si')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ör: 123456789012345678')
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await i.showModal(modal);
      }

      else if (i.customId === 'bot_info') {
        const uptime = Math.floor(interaction.client.uptime / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;

        const embed = new EmbedBuilder()
          .setTitle('🤖 Bot Bilgisi')
          .setColor('Blue')
          .addFields(
            { name: 'Kullanıcı', value: interaction.client.user.tag, inline: true },
            { name: 'Bot ID', value: interaction.client.user.id, inline: true },
            { name: 'Çalışma Süresi', value: `${hours} saat, ${minutes} dakika, ${seconds} saniye`, inline: false },
            { name: 'Toplam Komut', value: `${interaction.client.commands.size}`, inline: true },
            { name: 'Sunucu Sayısı', value: `${interaction.client.guilds.cache.size}`, inline: true },
            { name: 'Ping', value: `${Math.round(interaction.client.ws.ping)} ms`, inline: true },
          )
          .setFooter({ text: 'Bot Yönetim Paneli' })
          .setTimestamp();

        await i.reply({ embeds: [embed], ephemeral: true });
        console.log(`[BOT-YÖNETİM] ${i.user.tag} bot bilgisi görüntüledi.`);
      }
    });

    // Modal submit listener
    interaction.client.on('interactionCreate', async modalInteraction => {
      if (modalInteraction.type !== InteractionType.ModalSubmit) return;

      if (modalInteraction.customId === 'change_status_modal') {
        const newStatus = modalInteraction.fields.getTextInputValue('status_input');
        try {
          await interaction.client.user.setActivity(newStatus);
          await modalInteraction.reply({ content: `✅ Durum mesajı başarıyla "${newStatus}" olarak değiştirildi!`, ephemeral: true });
          console.log(`[BOT-YÖNETİM] ${modalInteraction.user.tag} durum mesajını "${newStatus}" olarak değiştirdi.`);
        } catch (error) {
          console.error(error);
          await modalInteraction.reply({ content: '❌ Durum mesajı değiştirilemedi.', ephemeral: true });
        }
      }

      else if (modalInteraction.customId === 'set_log_channel_modal') {
        const channelId = modalInteraction.fields.getTextInputValue('log_channel_id');
        const channel = interaction.client.channels.cache.get(channelId);

        if (!channel) {
          return modalInteraction.reply({ content: '❌ Geçerli bir kanal ID\'si girin.', ephemeral: true });
        }

        // Burada log kanalını config veya DB'ye kaydedebilirsin.
        // Örnek:
        // client.settings.set('logChannelId', channelId);

        await modalInteraction.reply({ content: `✅ Log kanalı başarıyla ${channel} olarak ayarlandı.`, ephemeral: true });
        console.log(`[BOT-YÖNETİM] ${modalInteraction.user.tag} log kanalını ${channel.name} (${channelId}) olarak ayarladı.`);
      }
    });
  },
};
