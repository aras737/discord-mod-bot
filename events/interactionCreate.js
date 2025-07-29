const { Events, PermissionsBitField } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client, config) {
    if (interaction.isButton()) {
      if (interaction.customId === 'open_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        // Zaten açık bilet kontrolü
        const existing = guild.channels.cache.find(c =>
          c.name === `ticket-${member.user.username.toLowerCase()}` &&
          c.parentId === config.TICKET_CATEGORY_ID
        );

        if (existing) {
          return interaction.reply({ content: `Zaten açık bir biletin var: ${existing}`, ephemeral: true });
        }

        // Bilet kanalı oluştur
        guild.channels.create({
          name: `ticket-${member.user.username}`,
          type: 0,
          parent: config.TICKET_CATEGORY_ID,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: member.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
            },
            {
              id: config.SUPPORT_ROLE_ID,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
            },
          ],
        }).then(channel => {
          channel.send(`Merhaba ${member}, destek ekibimiz en kısa sürede ilgilenecektir. Biletini kapatmak için \`/bilet-kapat\` komutunu kullanabilirsin.`);
          interaction.reply({ content: `Biletin oluşturuldu: ${channel}`, ephemeral: true });
        }).catch(err => {
          console.error(err);
          interaction.reply({ content: 'Bilet oluşturulurken hata oluştu.', ephemeral: true });
        });
      }
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Komut çalıştırılamadı.', ephemeral: true });
      }
    }
  },
};
