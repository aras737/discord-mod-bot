const { PermissionsBitField, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          return interaction.reply({ content: '❌ Ban yetkiniz yok!', ephemeral: true });
        }

        const user = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        if (!user) return interaction.reply({ content: '❌ Banlanacak kullanıcıyı seçmelisiniz!', ephemeral: true });

        try {
          const member = await interaction.guild.members.fetch(user.id);
          if (!member) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı!', ephemeral: true });
          if (!member.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam!', ephemeral: true });

          await member.ban({ reason });

          try {
            await user.send(`❌ **${interaction.guild.name}** sunucusunda banlandınız. Sebep: ${reason}`);
          } catch (err) {
            console.warn(`DM gönderilemedi: ${err.message}`);
          }

          return interaction.reply({ content: `✅ ${user.tag} başarıyla banlandı! Sebep: ${reason}` });
        } catch (error) {
          console.error('Ban hatası:', error);
          return interaction.reply({ content: '❌ Ban işlemi başarısız oldu!', ephemeral: true });
        }
      }

      else if (commandName === 'kick') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
          return interaction.reply({ content: '❌ Kick yetkiniz yok!', ephemeral: true });
        }

        const user = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        if (!user) return interaction.reply({ content: '❌ Kicklenecek kullanıcıyı seçmelisiniz!', ephemeral: true });

        try {
          const member = await interaction.guild.members.fetch(user.id);
          if (!member) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı!', ephemeral: true });
          if (!member.kickable) return interaction.reply({ content: '❌ Bu kullanıcıyı kickleyemem!', ephemeral: true });

          await member.kick(reason);

          try {
            await user.send(`⚠️ **${interaction.guild.name}** sunucusundan atıldınız. Sebep: ${reason}`);
          } catch (err) {
            console.warn(`DM gönderilemedi: ${err.message}`);
          }

          return interaction.reply({ content: `✅ ${user.tag} başarıyla atıldı! Sebep: ${reason}` });
        } catch (error) {
          console.error('Kick hatası:', error);
          return interaction.reply({ content: '❌ Kick işlemi başarısız oldu!', ephemeral: true });
        }
      }

      else if (commandName === 'duyuru') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
          return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok!', ephemeral: true });
        }

        const kanal = interaction.options.getChannel('kanal');
        const mesaj = interaction.options.getString('mesaj');

        if (!kanal || kanal.type !== ChannelType.GuildText) {
          return interaction.reply({ content: '❌ Geçerli bir metin kanalı seçmelisiniz!', ephemeral: true });
        }

        const duyuruEmbed = new EmbedBuilder()
          .setTitle('📢 Yeni Duyuru!')
          .setDescription(mesaj)
          .setColor('#FFD700')
          .setFooter({ text: `Duyuru ${interaction.user.tag} tarafından yapıldı.` })
          .setTimestamp();

        try {
          await kanal.send({ content: '@everyone', embeds: [duyuruEmbed] });
          return interaction.reply({ content: `✅ Duyuru başarıyla gönderildi: ${kanal}`, ephemeral: true });
        } catch (error) {
          console.error('Duyuru hatası:', error);
          return interaction.reply({ content: '❌ Duyuru gönderilemedi!', ephemeral: true });
        }
      }
    }

    else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_menu') {
        const category = interaction.values[0];

        const existingChannel = interaction.guild.channels.cache.find(ch =>
          ch.name === `ticket-${interaction.user.id}`
        );

        if (existingChannel) {
          return interaction.reply({
            content: `❌ Zaten açık bir bilet kanalınız var: ${existingChannel}`,
            ephemeral: true,
          });
        }

        try {
          const ticketCategory = interaction.guild.channels.cache.find(c =>
            c.name.toLowerCase() === 'biletler' && c.type === ChannelType.GuildCategory
          );

          const supportRoleId = 'destek-ekibi-rol-id'; // Gerekirse değiştir

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
              ...(supportRoleId ? [{ id: supportRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] : []),
            ],
          });

          const embed = new EmbedBuilder()
            .setTitle(`🎫 Biletiniz açıldı!`)
            .setDescription(
              `Merhaba ${interaction.user},\n` +
              `Bilet kategoriniz: **${category.toUpperCase()}**\n\n` +
              `Lütfen sorununuzu detaylı bir şekilde yazınız.\n` +
              `Yetkililer en kısa sürede size dönüş yapacaktır.\n\n` +
              `❗ Kanalı kapatmak için yetkililerle iletişime geçiniz.`
            )
            .setColor('#00AAFF');

          const kurallarEmbed = new EmbedBuilder()
            .setTitle('📜 Bilet Kuralları')
            .setDescription(
              '1️⃣ Küfür, hakaret veya saygısızlık yasaktır.\n' +
              '2️⃣ Gereksiz spam yapmayınız.\n' +
              '3️⃣ Bilet sadece destek amaçlı kullanılmalıdır.\n' +
              '4️⃣ Yetkililer size yardımcı olmak için buradalar, lütfen sabırlı olun.\n' +
              '5️⃣ Kurallara uyulmadığında bilet kapatılabilir.'
            )
            .setColor('#FFAA00');

          await channel.send({ content: `${interaction.user}`, embeds: [embed, kurallarEmbed] });

          return interaction.reply({
            content: `✅ Bilet kanalınız oluşturuldu: ${channel}`,
            ephemeral: true,
          });
        } catch (error) {
          console.error('Bilet oluşturma hatası:', error);
          return interaction.reply({ content: '❌ Bilet oluşturulamadı, lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
      }
    }
  },
};
