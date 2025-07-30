const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Slash komutları çalıştır
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: '❌ Komut çalıştırılırken bir hata oluştu.',
          ephemeral: true,
        });
      }
    }

    // Ticket sistemi - Select Menu
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
      const categoryMap = {
        destek: '📩-destek',
        sikayet: '🚫-şikayet',
        basvuru: '📄-başvuru',
      };

      const selected = interaction.values[0];
      const ticketName = `${categoryMap[selected]}-${interaction.user.username}`.toLowerCase();

      const existing = interaction.guild.channels.cache.find(c => c.name === ticketName);
      if (existing) return interaction.reply({ content: '❗ Zaten açık bir biletiniz var.', ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: ticketName,
        type: 0, // GUILD_TEXT
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      await channel.send({
        content: `<@${interaction.user.id}> 🎫 Biletiniz açıldı. Yetkililer sizinle en kısa sürede ilgilenecektir.`,
      });

      await interaction.reply({
        content: `✅ Bilet kanalınız oluşturuldu: <#${channel.id}>`,
        ephemeral: true,
      });
    }

    // Duyuru butonu tıklanınca everyone atılsın
    if (interaction.isButton()) {
      if (interaction.customId === 'duyuru_gonder') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: '🚫 Bu butonu kullanmak için yetkin yok.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setTitle('📢 Duyuru')
          .setDescription('Sunucuya önemli bir duyuru yapılmıştır.')
          .setColor('Orange')
          .setTimestamp();

        await interaction.channel.send({
          content: '@everyone',
          embeds: [embed],
        });

        await interaction.reply({ content: '📨 Duyuru gönderildi.', ephemeral: true });
      }
    }

    // Uyarı sisteminden gelen DM mesajı
    if (interaction.commandName === 'uyar') {
      const target = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
      const moderator = interaction.user.tag;
      const time = `<t:${Math.floor(Date.now() / 1000)}:F>`;

      const dmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Uyarı Aldınız')
        .setDescription(`Yetkili: **${moderator}**\nZaman: ${time}\nSebep: **${reason}**`)
        .setColor('Red');

      try {
        await target.send({ embeds: [dmEmbed] });
      } catch (err) {
        console.warn(`❗ ${target.tag} kişisine DM gönderilemedi.`);
      }
    }
  },
};
