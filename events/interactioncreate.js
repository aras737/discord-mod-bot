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
      // ✅ SLASH KOMUTLAR
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // 🔨 Ban
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
          } catch {
            return interaction.reply({ content: '❌ Ban işlemi başarısız oldu!', ephemeral: true });
          }
        }

        // 👢 Kick
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
          } catch {
            return interaction.reply({ content: '❌ Kick işlemi başarısız oldu!', ephemeral: true });
          }
        }

        // 📣 Duyuru
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
          } catch {
            return interaction.reply({ content: '❌ Duyuru gönderilemedi.', ephemeral: true });
          }
        }

        // 🎫 Ticket Panel
        else if (commandName === 'ticket-panel') {
          const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_menu')
            .setPlaceholder('🎫 Destek Kategorisi Seçin')
            .addOptions([
              { label: 'Genel Destek', value: 'genel', description: 'Genel konularda yardım' },
              { label: 'Yetkili Başvuru', value: 'basvuru', description: 'Yetkili olmak istiyorum' },
              { label: 'Ortaklık', value: 'ortaklik', description: 'Ortaklık talebi' },
            ]);

          const row = new ActionRowBuilder().addComponents(menu);
          await interaction.reply({
            content: '🎟️ Aşağıdan bir kategori seçerek destek talebi oluşturabilirsiniz:',
            components: [row],
          });
        }
      }

      // 🎟️ Ticket Oluşturma
      else if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
        const category = interaction.values[0];
        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
        if (existing)
          return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${existing}`, ephemeral: true });

        const ticketCategory = interaction.guild.channels.cache.find(c =>
          c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('bilet')
        );

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: ticketCategory?.id || null,
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
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle('🎫 Yeni Bilet')
          .setDescription(`Kategori: **${category}**\nAşağıdaki butonla bileti kapatabilirsiniz.`)
          .setColor('Blue');

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_kapat')
            .setLabel('🔒 Kapat')
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Bilet oluşturuldu: ${channel}`, ephemeral: true });
      }

      // 🎯 Bilet Kapatma
      else if (interaction.isButton() && interaction.customId === 'ticket_kapat') {
        await interaction.reply({ content: '📪 Bilet kapatılıyor...', ephemeral: true });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
      }

    } catch (err) {
      console.error('interactionCreate.js Hata:', err);
      if (
        interaction.type === InteractionType.ApplicationCommand &&
        !interaction.replied
      ) {
        await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
      }
    }
  },
};
