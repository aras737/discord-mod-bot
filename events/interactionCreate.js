const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  InteractionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // ✅ Slash Komutlar
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        switch (commandName) {
          case 'ban': {
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
              try { await user.send(`🚫 **${interaction.guild.name}** sunucusundan banlandınız.\nSebep: ${reason}`); } catch {}

              return interaction.reply({ content: `✅ ${user.tag} banlandı. Sebep: ${reason}` });
            } catch (err) {
              console.error('Ban hatası:', err);
              return interaction.reply({ content: '❌ Ban işlemi başarısız oldu!', ephemeral: true });
            }
          }

          case 'kick': {
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
              try { await user.send(`⚠️ **${interaction.guild.name}** sunucusundan atıldınız.\nSebep: ${reason}`); } catch {}

              return interaction.reply({ content: `✅ ${user.tag} başarıyla atıldı! Sebep: ${reason}` });
            } catch (err) {
              console.error('Kick hatası:', err);
              return interaction.reply({ content: '❌ Kick işlemi başarısız oldu!', ephemeral: true });
            }
          }

          case 'duyuru': {
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

          default:
            return interaction.reply({ content: '❌ Bu komut tanımlı değil.', ephemeral: true });
        }
      }

      // ✅ Menü Seçimleri (Özellikle Bilet Sistemi)
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
              c.type === ChannelType.GuildCategory &&
              c.name.toLowerCase().includes('bilet')
            );

            const supportRoleId = '1394428979129221296'; // 👈 Destek rol ID'sini doğru gir!

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
                {
                  id: supportRoleId,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                  ]
                }
              ]
            });

            const embed = new EmbedBuilder()
              .setTitle('🎫 Biletiniz Açıldı')
              .setDescription(`Kategori: **${kategori.toUpperCase()}**\n\nLütfen detaylı açıklama yapınız.`)
              .setColor('#00AAFF')
              .setTimestamp();

            const kurallar = new EmbedBuilder()
              .setTitle('📜 Bilet Kuralları')
              .setDescription(`• Saygılı olun.\n• Spam yapmayın.\n• Gereksiz etiket yapmayın.\n• Destek ekibini bekleyin.`)
              .setColor('#FF9900');

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('kapat')
                .setLabel('🔒 Bileti Kapat')
                .setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `${interaction.user}`, embeds: [embed, kurallar], components: [row] });

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

      // ✅ Bilet kapatma butonu
      else if (interaction.isButton() && interaction.customId === 'kapat') {
        await interaction.reply({ content: '📪 Bilet 5 saniye içinde kapatılıyor...', ephemeral: true });
        setTimeout(() => {
          interaction.channel.delete().catch(() => null);
        }, 5000);
      }
    } catch (err) {
      console.error('interactionCreate genel hata:', err);
      if (
        interaction.type === InteractionType.ApplicationCommand &&
        !interaction.replied
      ) {
        await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
      }
    }
  }
};
