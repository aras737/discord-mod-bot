const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client, config) {
    console.log(`Bot aktif: ${client.user.tag}`);

    // Panel mesajını gönder
    try {
      const channel = await client.channels.fetch(config.PANEL_CHANNEL_ID);
      if (!channel) return console.error('Panel kanalı bulunamadı!');

      // Önce varsa eski panel mesajlarını sil
      const messages = await channel.messages.fetch({ limit: 10 });
      messages.forEach(msg => {
        if (msg.author.id === client.user.id && msg.components.length > 0) {
          msg.delete().catch(console.error);
        }
      });

      // Bilet açma butonu
      const ticketButton = new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎫 Bilet Aç')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(ticketButton);

      await channel.send({ content: 'Destek almak için aşağıdaki butona tıklayınız:', components: [row] });
    } catch (error) {
      console.error('Panel mesajı gönderilirken hata:', error);
    }
  },
};
