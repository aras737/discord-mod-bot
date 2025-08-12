const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-yonetim')
    .setDescription('Bot yönetim panelini açar'),

  async execute(interaction) {
    // Yetki kontrolü: sadece BOT sahipleri veya yönetici rolü olanlar
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Bu komutu kullanmak için yetkiniz yok!', ephemeral: true });
    }

    // Butonlar oluşturuluyor
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('restart_bot')
        .setLabel('🔄 Botu Yeniden Başlat')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('stop_bot')
        .setLabel('⛔ Botu Durdur')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('show_ping')
        .setLabel('🏓 Ping Göster')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('list_commands')
        .setLabel('📜 Komut Listesi')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('change_status')
        .setLabel('⚙️ Durum Mesajını Değiştir')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ content: 'Bot Yönetim Paneli:', components: [row], ephemeral: true });

    // Collector ile butonlara yanıt verme
    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 }); // 5 dk

    collector.on('collect', async i => {
      if (i.customId === 'restart_bot') {
        await i.deferUpdate();
        await i.followUp({ content: 'Bot yeniden başlatılıyor...', ephemeral: true });
        console.log('Bot yeniden başlatılıyor...');
        process.exit(1); // Genellikle PM2 veya benzeri ile restart edilir
      } else if (i.customId === 'stop_bot') {
        await i.deferUpdate();
        await i.followUp({ content: 'Bot durduruluyor...', ephemeral: true });
        console.log('Bot durduruluyor...');
        process.exit(0);
      } else if (i.customId === 'show_ping') {
        const ping = Math.round(interaction.client.ws.ping);
        await i.reply({ content: `🏓 Ping: ${ping} ms`, ephemeral: true });
      } else if (i.customId === 'list_commands') {
        const commands = interaction.client.commands.map(cmd => cmd.data.name).join(', ');
        await i.reply({ content: `📜 Komutlar: ${commands}`, ephemeral: true });
      } else if (i.customId === 'change_status') {
        // Modal ile durum mesajı alacağız
        const modal = new ModalBuilder()
          .setCustomId('change_status_modal')
          .setTitle('Durum Mesajını Değiştir');

        const input = new TextInputBuilder()
          .setCustomId('status_input')
          .setLabel('Yeni durum mesajı (ör: Playing XYZ)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setPlaceholder('Durum mesajını yazınız...')
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await i.showModal(modal);
      }
    });

    // Modal submit listener
    interaction.client.on('interactionCreate', async modalInteraction => {
      if (modalInteraction.type === InteractionType.ModalSubmit && modalInteraction.customId === 'change_status_modal') {
        const newStatus = modalInteraction.fields.getTextInputValue('status_input');
        try {
          await interaction.client.user.setActivity(newStatus);
          await modalInteraction.reply({ content: `Durum mesajı başarıyla "${newStatus}" olarak değiştirildi!`, ephemeral: true });
          console.log(`Durum mesajı değiştirildi: ${newStatus}`);
        } catch (error) {
          console.error('Durum mesajı değiştirilemedi:', error);
          await modalInteraction.reply({ content: 'Durum mesajı değiştirilirken bir hata oluştu.', ephemeral: true });
        }
      }
    });
  },
};
