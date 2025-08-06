const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  InteractionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // ✅ SLASH KOMUTLAR
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
      }

      // ✅ BİLET PANEL BUTONU
      if (interaction.isButton() && interaction.customId === 'open_ticket_menu') {
        await interaction.deferUpdate();

        const menu = new StringSelectMenuBuilder()
          .setCustomId('ticket_menu')
          .setPlaceholder('Bir kategori seçin')
          .addOptions([
            { label: 'Genel Destek', value: 'genel' },
            { label: 'Satın Alma', value: 'satin_alma' },
            { label: 'Şikayet', value: 'sikayet' },
          ]);

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.followUp({
          content: '📋 Lütfen bir kategori seçin:',
          components: [row],
          ephemeral: true,
        });
      }

      // ✅ BİLET MENÜSÜ SEÇİLDİ
      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
        await interaction.deferReply({ ephemeral: true });

        const kategori = interaction.values[0];
        const existing = interaction.guild.channels.cache.find(c =>
          c.name === `ticket-${interaction.user.id}`
        );
        if (existing) {
          return interaction.editReply({ content: `❌ Zaten açık bir biletin var: ${existing}` });
        }

        const ticketCategory = interaction.guild.channels.cache.find(c =>
          c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('bilet')
        );

        const destekRolId = 'DESTEK_ROLE_ID'; // 🎯 BURAYI DEĞİŞTİR

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: ticketCategory?.id || null,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
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
            {
              id: destekRolId,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });

        const bilgi = new EmbedBuilder()
          .setTitle('🎫 Bilet Açıldı')
          .setDescription(`Kategori: **${kategori.toUpperCase()}**\nLütfen detay verin, destek ekibi yakında sizinle ilgilenecek.`)
          .setColor('Blue');

        const kurallar = new EmbedBuilder()
          .setTitle('📜 Kurallar')
          .setDescription('• Saygılı olun\n• Spam yapmayın\n• Sabırlı olun\n• Yetkilileri etiketlemeyin.')
          .setColor('Orange');

        const kapat = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_kapat')
            .setLabel('🔒 Bileti Kapat')
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
          content: `${interaction.user}`,
          embeds: [bilgi, kurallar],
          components: [kapat],
        });

        await interaction.editReply({ content: `✅ Bilet oluşturuldu: ${channel}` });
      }

      // ✅ BİLET KAPATMA BUTONU
      if (interaction.isButton() && interaction.customId === 'ticket_kapat') {
        await interaction.reply({ content: '📪 5 saniye içinde bilet kapatılıyor...', ephemeral: true });
        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
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
  },
};
