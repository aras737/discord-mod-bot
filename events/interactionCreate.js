const { PermissionsBitField, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, '../data/banList.json');

// Ban listesini oku
function readBanList() {
  try {
    if (!fs.existsSync(banListPath)) return [];
    const data = fs.readFileSync(banListPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Ban listesini kaydet
function writeBanList(list) {
  fs.writeFileSync(banListPath, JSON.stringify(list, null, 2));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // *** Ticket menü ***
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_menu') {
        const category = interaction.values[0];
        const existingChannel = interaction.guild.channels.cache.find(
          ch => ch.name === `ticket-${interaction.user.username.toLowerCase()}`
        );
        if (existingChannel) {
          return interaction.reply({
            content: `❌ Zaten açık bir bilet kanalınız var: ${existingChannel}`,
            ephemeral: true,
          });
        }

        try {
          const ticketCategory = interaction.guild.channels.cache.find(c => c.name.toLowerCase() === 'biletler' && c.type === ChannelType.GuildCategory);

          const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: ticketCategory ? ticketCategory.id : null,
            permissionOverwrites: [
              {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
              },
              // Destek ekibi rolünü buraya ekleyebilirsin:
              // { id: 'destek-ekibi-rol-id', allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
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

          await interaction.reply({
            content: `✅ Bilet kanalınız oluşturuldu: ${channel}`,
            ephemeral: true,
          });
        } catch (error) {
          console.error('Bilet oluşturma hatası:', error);
          await interaction.reply({ content: '❌ Bilet oluşturulamadı, lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
      }
    }

    // *** Slash komutları ***
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // Ban komutu
    if (commandName === 'ban') {
      // Yetki kontrolü
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return interaction.reply({ content: '❌ Bu komutu kullanmak için Ban Üyeleri yetkiniz olmalı!', ephemeral: true });
      }

      const user = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

      if (!user) return interaction.reply({ content: '❌ Banlanacak kullanıcıyı belirtiniz!', ephemeral: true });

      // Kullanıcıyı banla
      try {
        const member = await interaction.guild.members.fetch(user.id);

        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: '❌ Yönetici olan kullanıcıyı banlayamazsınız!', ephemeral: true });
        }

        await member.ban({ reason });

        // Ban listesine ekle
        const banList = readBanList();
        if (!banList.find(b => b.userId === user.id && b.guildId === interaction.guild.id)) {
          banList.push({
            userId: user.id,
            username: user.tag,
            guildId: interaction.guild.id,
            bannedAt: new Date().toISOString(),
            reason,
          });
          writeBanList(banList);
        }

        // DM at
        try {
          await user.send(`❌ **${interaction.guild.name}** sunucusunda banlandınız. Sebep: ${reason}`);
        } catch {
          // DM atılamadı
        }

        await interaction.reply({ content: `✅ ${user.tag} başarıyla banlandı! Sebep: ${reason}` });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: '❌ Kullanıcı bulunamadı veya banlanamadı.', ephemeral: true });
      }
    }

    // Kick komutu
    else if (commandName === 'kick') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return interaction.reply({ content: '❌ Bu komutu kullanmak için Üyeleri At yetkiniz olmalı!', ephemeral: true });
      }

      const user = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

      if (!user) return interaction.reply({ content: '❌ Kicklenecek kullanıcıyı belirtiniz!', ephemeral: true });

      try {
        const member = await interaction.guild.members.fetch(user.id);

        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: '❌ Yönetici olan kullanıcıyı kickleyemezsiniz!', ephemeral: true });
        }

        await member.kick(reason);

        // DM at
        try {
          await user.send(`❗ **${interaction.guild.name}** sunucusundan atıldınız. Sebep: ${reason}`);
        } catch {
          // DM atılamadı
        }

        await interaction.reply({ content: `✅ ${user.tag} başarıyla sunucudan atıldı! Sebep: ${reason}` });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: '❌ Kullanıcı bulunamadı veya atılamadı.', ephemeral: true });
      }
    }

    // Banlist komutu
    else if (commandName === 'banlist') {
      const banList = readBanList().filter(b => b.guildId === interaction.guild.id);

      if (!banList.length) {
        return interaction.reply({ content: '❌ Bu sunucuda banlanmış kullanıcı yok.', ephemeral: true });
      }

      const banListText = banList
        .map((b, i) => `${i + 1}. ${b.username} - Ban Tarihi: ${new Date(b.bannedAt).toLocaleString()} - Sebep: ${b.reason || 'Belirtilmedi'}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`${interaction.guild.name} Ban Listesi`)
        .setDescription(banListText)
        .setColor('#FF0000');

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
