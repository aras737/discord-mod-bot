const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  InteractionType
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // Slash komutlar (ban, kick, duyuru)
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // ✅ BAN
        if (commandName === 'ban') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '❌ Ban yetkiniz yok!', ephemeral: true });
          }

          const user = interaction.options.getUser('kullanici');
          const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

          if (!user) return interaction.reply({ content: '❌ Kullanıcı seçmelisiniz!', ephemeral: true });

          try {
            const member = await interaction.guild.members.fetch(user.id);
            if (!member.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam!', ephemeral: true });

            await member.ban({ reason });

            try {
              await user.send(`❌ **${interaction.guild.name}** sunucusundan banlandınız. Sebep: ${reason}`);
            } catch {}

            return interaction.reply({ content: `✅ ${user.tag} banlandı. Sebep: ${reason}` });
          } catch (err) {
            console.error('Ban hatası:', err);
            return interaction.reply({ content: '❌ Ban işlemi başarısız oldu!', ephemeral: true });
          }
        }

        // ✅ KICK
        else if (commandName === 'kick') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: '❌ Kick yetkiniz yok!', ephemeral: true });
          }

          const user = interaction.options.getUser('kullanici');
          const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

          if (!user) return interaction.reply({ content: '❌ Kullanıcı seçmelisiniz!', ephemeral: true });

          try {
            const member = await interaction.guild.members.fetch(user.id);
            if (!member.kickable) return interaction.reply({ content: '❌ Bu kullanıcıyı atamam!', ephemeral: true });

            await member.kick(reason);

            try {
              await user.send(`⚠️ **${interaction.guild.name}** sunucusundan atıldınız. Sebep: ${reason}`);
            } catch {}

            return interaction.reply({ content: `✅ ${user.tag} başarıyla atıldı! Sebep: ${reason}` });
          } catch (err) {
            console.error('Kick hatası:', err);
            return interaction.reply({ content: '❌ Kick işlemi başarısız oldu!', ephemeral: true });
          }
        }

        // ✅ DUYURU
        else if (commandName === 'duyuru') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: '❌ Duyuru için yetkiniz yok!', ephemeral: true });
          }

          const kanal = interaction.options.getChannel('kanal');
          const mesaj = interaction.options.getString('mesaj');

          if (!kanal || kanal.type !== ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Geçerli bir metin kanalı seçmelisiniz!', ephemeral: true });
          }

          const embed = new EmbedBuilder()
            .setTitle('📢 Yeni Duyuru')
            .setDescription(mesaj)
            .setColor('Gold')
            .setFooter({ text: `Duyuru yapan: ${interaction.user.tag}` })
            .setTimestamp();

          try {
            await kanal.send({ content: '@everyone', embeds: [embed] });
            return interaction.reply({ content: `✅ Duyuru gönderildi: ${kanal}`, ephemeral: true });
          } catch (err) {
            console.error('Duyuru hatası:', err);
            return interaction.reply({ content: '❌ Duyuru gönderilemedi.', ephemeral: true });
          }
        }
      }

      // ✅ Bilet sistemi (select menu)
      else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_menu') {
          const kategori = interaction.values[0] || 'genel';

          const existing = interaction.guild.channels.cache.find(c =>
            c.name === `ticket-${interaction.user.id}`
          );

          if (existing) {
            return interaction.reply({ content: `❌ Zaten bir biletin var: ${existing}`, ephemeral: true });
          }

          try {
            const ticketCategory = interaction.guild.channels.cache.find(c =>
              c.name.toLowerCase().includes('bilet') &&
              c.type === ChannelType.GuildCategory
            );

            const supportRoleId = '1394428979129221296'; // Rol ID'yi buraya ekle

            const channel = await interaction.guild.channels.create({
              name: `ticket-${interaction.user.id}`,
              type: ChannelType.GuildText,
              parent: ticketCategory?.id || null,
              permissionOverwrites: [
                {
                  id: interaction.guild.roles.everyone.id,
                  deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                  id: interaction.user.id,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                  ]
                },
                ...(supportRoleId
                  ? [{
                    id: supportRoleId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                  }]
                  : [])
              ]
            });

            const embed = new EmbedBuilder()
              .setTitle('🎫 Biletiniz Açıldı')
              .setDescription(`Kategori: **${kategori.toUpperCase()}**\n\nLütfen sorununuzu detaylıca belirtin.`)
              .setColor('#00AAFF')
              .setTimestamp();

            const kurallar = new EmbedBuilder()
              .setTitle('📜 Bilet Kuralları')
              .setDescription(
                `• Saygılı olun.\n• Spam yapmayın.\n• Konuyla alakasız mesaj atmayın.\n• Destek ekibinin cevabını bekleyin.`
              )
              .setColor('#FFAA00');

            await channel.send({ content: `${interaction.user}`, embeds: [embed, kurallar] });

            return interaction.reply({
              content: `✅ Bilet kanalınız oluşturuldu: ${channel}`,
              ephemeral: true
            });

          } catch (err) {
            console.error('Bilet açma hatası:', err);
            return interaction.reply({
              content: '❌ Bilet oluşturulamadı. Lütfen sonra tekrar deneyin.',
              ephemeral: true
            });
          }
        }
      }

    } catch (err) {
      console.error('Genel interactionCreate hatası:', err);
      if (interaction.type === InteractionType.ApplicationCommand && !interaction.replied) {
        await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
      }
    }
  }
};
