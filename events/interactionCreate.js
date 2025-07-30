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
      // ✅ SLASH KOMUTLARI
      if (interaction.type === InteractionType.ApplicationCommand) {
        const { commandName } = interaction;

        // /ban
        if (commandName === 'ban') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '❌ Ban yetkiniz yok!', ephemeral: true });
          }

          const user = interaction.options.getUser('kullanici');
          const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

          if (!user) return interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });

          const member = await interaction.guild.members.fetch(user.id).catch(() => null);
          if (!member) return interaction.reply({ content: '❌ Kullanıcı sunucuda yok!', ephemeral: true });
          if (!member.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam!', ephemeral: true });

          await member.ban({ reason });

          try {
            await user.send(`🚫 **${interaction.guild.name}** sunucusundan **banlandınız**.\n📝 Sebep: ${reason}`);
          } catch (e) {
            console.warn('❗ DM gönderilemedi.');
          }

          return interaction.reply({ content: `✅ ${user.tag} başarıyla banlandı!` });
        }

        // /kick
        else if (commandName === 'kick') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: '❌ Kick yetkiniz yok!', ephemeral: true });
          }

          const user = interaction.options.getUser('kullanici');
          const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

          if (!user) return interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });

          const member = await interaction.guild.members.fetch(user.id).catch(() => null);
          if (!member) return interaction.reply({ content: '❌ Kullanıcı sunucuda yok!', ephemeral: true });
          if (!member.kickable) return interaction.reply({ content: '❌ Bu kullanıcıyı kickleyemem!', ephemeral: true });

          await member.kick(reason);

          try {
            await user.send(`⚠️ **${interaction.guild.name}** sunucusundan **atıldınız**.\n📝 Sebep: ${reason}`);
          } catch (e) {
            console.warn('❗ DM gönderilemedi.');
          }

          return interaction.reply({ content: `✅ ${user.tag} başarıyla atıldı!` });
        }

        // /duyuru
        else if (commandName === 'duyuru') {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: '❌ Duyuru yetkiniz yok!', ephemeral: true });
          }

          const kanal = interaction.options.getChannel('kanal');
          const mesaj = interaction.options.getString('mesaj');

          if (!kanal || kanal.type !== ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Geçerli bir metin kanalı seçin!', ephemeral: true });
          }

          const embed = new EmbedBuilder()
            .setTitle('📢 Duyuru')
            .setDescription(mesaj)
            .setColor('Yellow')
            .setFooter({ text: `Gönderen: ${interaction.user.tag}` })
            .setTimestamp();

          await kanal.send({ content: '@everyone', embeds: [embed] });
          return interaction.reply({ content: `✅ Duyuru gönderildi: ${kanal}`, ephemeral: true });
        }
      }

      // ✅ SELECT MENU: Ticket sistemi
      else if (interaction.type === InteractionType.MessageComponent && interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_menu') {
          const selectedCategory = interaction.values[0];

          const existingChannel = interaction.guild.channels.cache.find(ch =>
            ch.name === `ticket-${interaction.user.id}`
          );

          if (existingChannel) {
            return interaction.reply({
              content: `❌ Zaten açık bir biletiniz var: ${existingChannel}`,
              ephemeral: true,
            });
          }

          const ticketCategory = interaction.guild.channels.cache.find(
            c => c.name.toLowerCase() === 'biletler' && c.type === ChannelType.GuildCategory
          );

          const destekRolID = '1394428979129221296'; // Destek rol ID (isteğe bağlı)

          const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.id}`,
            type: ChannelType.GuildText,
            parent: ticketCategory?.id,
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
              ...(destekRolID ? [{
                id: destekRolID,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
              }] : [])
            ],
          });

          const bilgi = new EmbedBuilder()
            .setTitle('🎫 Biletiniz açıldı')
            .setDescription(`Kategori: **${selectedCategory.toUpperCase()}**\nLütfen detaylı yazın.`)
            .setColor('Blue');

          const kurallar = new EmbedBuilder()
            .setTitle('📜 Bilet Kuralları')
            .setDescription(
              `- Küfür ve hakaret yasaktır\n` +
              `- Spam yapmayın\n` +
              `- Gereksiz açılan biletler kapatılır\n` +
              `- Yetkililer size kısa sürede dönecektir`
            )
            .setColor('Orange');

          await channel.send({ content: `${interaction.user}`, embeds: [bilgi, kurallar] });

          return interaction.reply({ content: `✅ Bilet açıldı: ${channel}`, ephemeral: true });
        }
      }

    } catch (error) {
      console.error('❌ interactionCreate hatası:', error);
      if (interaction && !interaction.replied) {
        await interaction.reply({ content: '❌ Bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true }).catch(() => { });
      }
    }
  },
};
