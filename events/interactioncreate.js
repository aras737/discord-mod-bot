const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  InteractionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'botuyonet') {
        await interaction.reply({
            content: 'Sadece sana görünüyor.',
            flags: 64 // InteractionResponseFlags.Ephemeral yerine 64
        });
    }
});
  
  // Kullanıcı rütbesini al
  const userRank = getUserRankLevel(interaction.member);

  // Eğer komutun minimum rütbe seviyesi varsa kontrol et
  if (command.minRank && userRank < command.minRank) {
    return interaction.reply({ 
      content: '🚫 Bu komutu kullanmak için yeterli yetkiye sahip değilsin.', 
      ephemeral: true 
    });
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ Komut hatası:`, err);
    await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
  }
});

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

      // ✅ TICKET OLUŞTUR (Buton)
      else if (interaction.isButton() && interaction.customId === 'ticket_olustur') {
        const existing = interaction.guild.channels.cache.find(c =>
          c.name === `ticket-${interaction.user.id}`
        );
        if (existing) {
          return interaction.reply({
            content: `❌ Zaten açık bir biletin var: ${existing}`,
            ephemeral: true
          });
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
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
                PermissionsBitField.Flags.ReadMessageHistory
              ],
            },
          ],
        });

        await channel.send({
          content: `${interaction.user}`,
          embeds: [
            new EmbedBuilder()
              .setTitle('🎫 Destek Talebi Oluşturuldu')
              .setDescription('👋 Merhaba! Lütfen yaşadığınız sorunu detaylıca yazın.\nYetkililer en kısa sürede yardımcı olacaktır.')
              .setColor('Blue')
          ]
        });

        return interaction.reply({
          content: `✅ Bilet başarıyla oluşturuldu: ${channel}`,
          ephemeral: true
        });
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
