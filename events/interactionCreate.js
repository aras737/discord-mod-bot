const { ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // Slash komutlar
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`❌ Komut hatası: ${error}`);
        await interaction.reply({
          content: '❌ Bu komut çalıştırılırken bir hata oluştu.',
          ephemeral: true,
        });
      }
    }

    // Buton etkileşimleri
    if (interaction.isButton()) {
      const { customId, user, guild } = interaction;

      // 🎫 Ticket oluşturma butonu
      if (customId === 'ticket-olustur') {
        const channelName = `ticket-${user.username.toLowerCase()}`;

        // Aynı isimde ticket var mı?
        const existing = guild.channels.cache.find(c => c.name === channelName);
        if (existing) {
          return interaction.reply({ content: '❗ Zaten bir ticket oluşturmuşsun.', ephemeral: true });
        }

        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
          ],
        });

        await ticketChannel.send({
          content: `<@${user.id}> destek talebin oluşturuldu.`,
        });

        await interaction.reply({
          content: '🎫 Ticket kanalın oluşturuldu.',
          ephemeral: true,
        });
      }

      // 📢 Duyuruyu görenleri onaylatma
      if (customId === 'onayla') {
        await interaction.reply({
          content: '✅ Duyuruyu gördüğünüz için teşekkürler!',
          ephemeral: true,
        });
      }
    }

    // Context menu, modal vs varsa buraya eklenebilir
  }
};
