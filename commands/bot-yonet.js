const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-yonet')
    .setDescription('Bot yönetim panelini açar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Yalnızca adminler çalıştırabilir

  async execute(interaction) {
    // Sunucu sahibi veya config.roles.ust içindeki roller engel tanımadan erişebilir
    const isUst = interaction.member.roles.cache.some(r => config.roles.ust.includes(r.name)) || interaction.guild.ownerId === interaction.user.id;
    if (!isUst) {
      return interaction.reply({ content: '🚫 Bu komutu kullanmak için yetkin yok.', ephemeral: true });
    }

    // Butonlar (fazla olursa satırlara böleceğiz)
    const buttons = [
      new ButtonBuilder().setCustomId('start').setLabel('Başlat').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('stop').setLabel('Durdur').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('restart').setLabel('Yeniden Başlat').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('reload').setLabel('Yeniden Yükle').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('status').setLabel('Durum').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('logs').setLabel('Loglar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('settings').setLabel('Ayarlar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('update').setLabel('Güncelle').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('shutdown').setLabel('Kapat').setStyle(ButtonStyle.Danger),
    ];

    // 5'li gruplara ayır
    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    await interaction.reply({
      content: '⚙️ **Bot Yönetim Paneli**\nButonlara tıklayarak işlemleri yapabilirsiniz.',
      components: rows,
      ephemeral: true
    });

    // Buton tıklamalarını dinle
    const collector = interaction.channel.createMessageComponentCollector({
      time: 5 * 60 * 1000 // 5 dakika açık kalır
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '🚫 Bu paneli sadece komutu kullanan kişi yönetebilir.', ephemeral: true });
      }

      const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
      const actionName = {
        start: 'Botu Başlattı',
        stop: 'Botu Durdurdu',
        restart: 'Botu Yeniden Başlattı',
        reload: 'Botu Yeniden Yükledi',
        status: 'Bot Durumunu Kontrol Etti',
        logs: 'Bot Loglarını Görüntüledi',
        settings: 'Bot Ayarlarını Açtı',
        update: 'Botu Güncelledi',
        shutdown: 'Botu Kapattı'
      }[i.customId] || 'Bilinmeyen İşlem';

      // Log kanalı varsa gönder
      if (logChannel) {
        logChannel.send(`🛠️ ${i.user.tag} **${actionName}**`);
      }

      await i.reply({ content: `✅ İşlem tamamlandı: **${actionName}**`, ephemeral: true });
    });

    collector.on('end', () => {
      console.log('⏹️ Bot yönetim paneli kapandı.');
    });
  }
};
