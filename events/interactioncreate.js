const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  InteractionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // =================== SLASH KOMUTLAR ===================
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // 🔨 Ban Komutu
        if (commandName === 'ban') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return interaction.reply({ content: '❌ Ban yetkiniz yok!', ephemeral: true });

          const user = interaction.options.getUser('kullanici');
          const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
          if (!user) return interaction.reply({ content: '❌ Kullanıcı seçmelisiniz!', ephemeral: true });

          try {
            const member = await interaction.guild.members.fetch(user.id);
            if (!member.bannable)
              return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam!', ephemeral: true });

            await member.ban({ reason });
            try { await user.send(`🚫 ${interaction.guild.name} sunucusundan banlandınız. Sebep: ${reason}`); } catch {}
            return interaction.reply({ content: `✅ ${user.tag} sunucudan banlandı. Sebep: ${reason}` });

          } catch (err) {
            console.error('Ban hatası:', err);
            return interaction.reply({ content: '❌ Ban işlemi başarısız oldu!', ephemeral: true });
          }
        }

        // 👢 Kick Komutu
        else if (commandName === 'kick') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return interaction.reply({ content: '❌ Kick yetkiniz yok!', ephemeral: true });

          const user = interaction.options.getUser('kullanici');
          const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
          if (!user) return interaction.reply({ content: '❌ Kullanıcı seçmelisiniz!', ephemeral: true });

          try {
            const member = await interaction.guild.members.fetch(user.id);
            if (!member.kickable)
              return interaction.reply({ content: '❌ Bu kullanıcıyı atamam!', ephemeral: true });

            await member.kick(reason);
            try { await user.send(`⚠️ ${interaction.guild.name} sunucusundan atıldınız. Sebep: ${reason}`); } catch {}
            return interaction.reply({ content: `✅ ${user.tag} başarıyla atıldı. Sebep: ${reason}` });

          } catch (err) {
            console.error('Kick hatası:', err);
            return interaction.reply({ content: '❌ Kick işlemi başarısız oldu!', ephemeral: true });
          }
        }

        // 📣 Duyuru Komutu
        else if (commandName === 'duyuru') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return interaction.reply({ content: '❌ Duyuru için yetkiniz yok!', ephemeral: true });

          const kanal = interaction.options.getChannel('kanal');
          const mesaj = interaction.options.getString('mesaj');
          if (!kanal || kanal.type !== ChannelType.GuildText)
            return interaction.reply({ content: '❌ Geçerli bir metin kanalı seçmelisiniz!', ephemeral: true });

          const embed = new EmbedBuilder()
            .setTitle('📢 Yeni Duyuru')
            .setDescription(mesaj)
            .setColor('Gold')
            .setFooter({ text: `Duyuru: ${interaction.user.tag}` })
            .setTimestamp();

          try {
            await kanal.send({ content: '@everyone', embeds: [embed] });
            return interaction.reply({ content: `✅ Duyuru gönderildi: ${kanal}`, ephemeral: true });
          } catch (err) {
            console.error('Duyuru hatası:', err);
            return interaction.reply({ content: '❌ Duyuru gönderilemedi.', ephemeral: true });
          }
        }

        // 🎫 /ticket-panel Komutu
        else if (commandName === 'ticket-panel') {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('open_ticket_menu')
              .setLabel('🎫 Bilet Oluştur')
              .setStyle(ButtonStyle.Primary)
          );

          return interaction.reply({
            content: 'Destek almak için aşağıdaki butona tıklayın:',
            components: [row],
          });
        }
      }

      // =================== BUTONLAR ===================

      // 🎫 Bilet Panelindeki Butona Tıklanınca
      if (interaction.isButton() && interaction.customId === 'open_ticket_menu') {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('ticket_menu')
          .setPlaceholder('Bir destek kategorisi seçin')
          .addOptions(
            {
              label: 'Genel Destek',
              value: 'genel',
              emoji: '💬',
            },
            {
              label: 'Satın Alma',
              value: 'satinalma',
              emoji: '💸',
            },
            {
              label: 'Şikayet',
              value: 'sikayet',
              emoji: '⚠️',
            }
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        return interaction.reply({
          content: 'Lütfen destek almak istediğiniz kategoriyi seçin:',
          components: [row],
          ephemeral: true,
        });
      }

      // ❌ Bilet Kapatma Butonu
      else if (interaction.isButton() && interaction.customId === 'ticket_kapat') {
        await interaction.reply({ content: '📪 Bilet 5 saniye içinde kapatılıyor...', ephemeral: true });
        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 5000);
      }

      // =================== SELECT MENU ===================

      else if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
        const kategori = interaction.values[0];
        const user = interaction.user;

        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${user.id}`);
        if (existing) {
          return interaction.reply({ content: `❌ Zaten bir biletin açık: ${existing}`, ephemeral: true });
        }

        const destekRolID = process.env.TICKET_SUPPORT_ROLE_ID || 'DESTEK_ROLE_ID';
        const category = interaction.guild.channels.cache.find(c =>
          c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('bilet')
        );

        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${user.id}`,
          type: ChannelType.GuildText,
          parent: category?.id || null,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            {
              id: destekRolID,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle('🎫 Bilet Açıldı')
          .setDescription(`Kategori: **${kategori}**\nLütfen sorununu detaylı yaz.`)
          .setColor('Blue')
          .setFooter({ text: `Kullanıcı: ${user.tag}` })
          .setTimestamp();

        const kurallar = new EmbedBuilder()
          .setTitle('📜 Kurallar')
          .setDescription('• Saygılı ol\n• Spam yapma\n• Gereksiz etiketleme yapma\n• Sabırlı ol')
          .setColor('Orange');

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_kapat')
            .setLabel('🔒 Bileti Kapat')
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `${user}`,
          embeds: [embed, kurallar],
          components: [row],
        });

        return interaction.reply({ content: `✅ Bilet oluşturuldu: ${ticketChannel}`, ephemeral: true });
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
  },
};
