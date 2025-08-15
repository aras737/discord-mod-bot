const { Events, EmbedBuilder, ChannelType, AuditLogEvent } = require('discord.js');

module.exports = (client) => {
    // Logların gönderileceği kanalın ID'si. Burayı kendi log kanalınla değiştir.
    const LOG_KANAL_ID = '1394408532929024102';

    // Mesaj silme olayını dinle
    client.on(Events.MessageDelete, async message => {
        if (!message.partial && message.author.bot) return;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Mesaj Silindi')
            .addFields(
                { name: 'Kanal', value: `${message.channel}`, inline: true },
                { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
                { name: 'Mesaj', value: `\`\`\`\n${message.content}\n\`\`\`` || 'Dosya/Embed', inline: false }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });

    // Mesaj düzenleme olayını dinle
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (oldMessage.content === newMessage.content || newMessage.author.bot) return;

        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle('Mesaj Düzenlendi')
            .addFields(
                { name: 'Kanal', value: `${oldMessage.channel}`, inline: true },
                { name: 'Kullanıcı', value: `${oldMessage.author.tag}`, inline: true },
                { name: 'Eski Mesaj', value: `\`\`\`\n${oldMessage.content}\n\`\`\``, inline: false },
                { name: 'Yeni Mesaj', value: `\`\`\`\n${newMessage.content}\n\`\`\``, inline: false }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });

    // Üye katılma olayını dinle
    client.on(Events.GuildMemberAdd, async member => {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Üye Katıldı')
            .setDescription(`${member.user.tag} adlı kullanıcı sunucuya katıldı.`)
            .addFields(
                { name: 'Üye Sayısı', value: `${member.guild.memberCount}` }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });

    // Üye ayrılma olayını dinle
    client.on(Events.GuildMemberRemove, async member => {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('Üye Ayrıldı')
            .setDescription(`${member.user.tag} adlı kullanıcı sunucudan ayrıldı.`)
            .addFields(
                { name: 'Üye Sayısı', value: `${member.guild.memberCount}` }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });

    // Üye güncelleme (takma ad, rol vb.) olayını dinle
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        const embed = new EmbedBuilder()
            .setColor('#0066ff')
            .setTitle('Üye Güncellendi')
            .setDescription(`${oldMember.user.tag} adlı kullanıcının bilgileri güncellendi.`)
            .setTimestamp();

        // Takma ad (nickname) değiştiyse
        if (oldMember.nickname !== newMember.nickname) {
            embed.addFields(
                { name: 'Takma Ad Değişikliği', value: `\`${oldMember.nickname || 'Yok'}\` -> \`${newMember.nickname || 'Yok'}\`` }
            );
        }

        // Rolleri değiştiyse
        const oldRoles = oldMember.roles.cache.map(r => r.name).join(', ');
        const newRoles = newMember.roles.cache.map(r => r.name).join(', ');
        if (oldRoles !== newRoles) {
            embed.addFields(
                { name: 'Rol Değişikliği', value: 'Roller güncellendi.' }
            );
        }

        if (embed.data.fields && embed.data.fields.length > 0) {
            const logChannel = await client.channels.fetch(LOG_KANAL_ID);
            if (logChannel) {
                logChannel.send({ embeds: [embed] });
            }
        }
    });

    // Kanal oluşturma olayını dinle
    client.on(Events.ChannelCreate, async channel => {
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('Kanal Oluşturuldu')
            .addFields(
                { name: 'Kanal Adı', value: `${channel.name}`, inline: true },
                { name: 'Kanal Türü', value: `${channel.type === ChannelType.GuildText ? 'Yazı' : 'Diğer'}`, inline: true }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });

    // Kanal silme olayını dinle
    client.on(Events.ChannelDelete, async channel => {
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('Kanal Silindi')
            .addFields(
                { name: 'Kanal Adı', value: `${channel.name}`, inline: true },
                { name: 'Kanal Türü', value: `${channel.type === ChannelType.GuildText ? 'Yazı' : 'Diğer'}`, inline: true }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });
    
    // BAN olayını dinle
    client.on(Events.GuildBanAdd, async ban => {
        const fetchedLogs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd,
        });
        const banLog = fetchedLogs.entries.first();

        let executor = 'Bilinmiyor';
        let reason = ban.reason || 'Sebep belirtilmemiş';

        if (banLog) {
            const { executor: banExecutor, target, reason: banReason } = banLog;
            if (target.id === ban.user.id) {
                executor = banExecutor.tag;
                if (banReason) reason = banReason;
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#d32f2f') // Koyu kırmızı
            .setTitle('Üye Banlandı')
            .addFields(
                { name: 'Kullanıcı', value: `${ban.user.tag}`, inline: true },
                { name: 'Banlayan', value: executor, inline: true },
                { name: 'Sebep', value: reason, inline: false }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });

    // BAN KALDIRMA olayını dinle
    client.on(Events.GuildBanRemove, async ban => {
        const embed = new EmbedBuilder()
            .setColor('#4caf50') // Yeşil
            .setTitle('Üyenin Banı Kaldırıldı')
            .addFields(
                { name: 'Kullanıcı', value: `${ban.user.tag}`, inline: true },
                { name: 'Banı Kaldıran', value: 'Bilinmiyor (Audit Log)', inline: true },
                { name: 'Sebep', value: 'Ban kaldırıldı.', inline: false }
            )
            .setTimestamp();

        const logChannel = await client.channels.fetch(LOG_KANAL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    });
};
