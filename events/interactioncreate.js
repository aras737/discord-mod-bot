const { 
    PermissionsBitField, 
    EmbedBuilder, 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    AttachmentBuilder 
} = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        // SLASH KOMUTLAR ======================
        if (interaction.isChatInputCommand()) {

            // BAN
            if (interaction.commandName === 'ban') {
                await interaction.deferReply({ ephemeral: true });

                if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                    return interaction.editReply('🚫 Ban yetkin yok.');
                }

                const user = interaction.options.getUser('kullanici');
                const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
                if (!user) return interaction.editReply('🚫 Kullanıcı seçmelisin.');

                try {
                    const member = await interaction.guild.members.fetch(user.id);
                    if (!member.bannable) return interaction.editReply('🚫 Bu kullanıcıyı banlayamam.');
                    await member.ban({ reason });
                    await interaction.editReply(`✅ ${user.tag} banlandı. Sebep: ${reason}`);
                } catch (err) {
                    console.error(err);
                    await interaction.editReply('❌ Ban başarısız.');
                }
            }

            // KICK
            if (interaction.commandName === 'kick') {
                await interaction.deferReply({ ephemeral: true });

                if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                    return interaction.editReply('🚫 Kick yetkin yok.');
                }

                const user = interaction.options.getUser('kullanici');
                const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
                if (!user) return interaction.editReply('🚫 Kullanıcı seçmelisin.');

                try {
                    const member = await interaction.guild.members.fetch(user.id);
                    if (!member.kickable) return interaction.editReply('🚫 Bu kullanıcıyı atamam.');
                    await member.kick(reason);
                    await interaction.editReply(`✅ ${user.tag} atıldı. Sebep: ${reason}`);
                } catch (err) {
                    console.error(err);
                    await interaction.editReply('❌ Kick başarısız.');
                }
            }

            // BANLIST
            if (interaction.commandName === 'banlist') {
                await interaction.deferReply({ ephemeral: true });

                try {
                    const bans = await interaction.guild.bans.fetch();
                    if (bans.size === 0) return interaction.editReply('🚫 Banlı kullanıcı yok.');
                    const list = bans.map(b => `${b.user.tag} (${b.user.id})`).join('\n');
                    await interaction.editReply(`📜 Banlı kullanıcılar:\n${list}`);
                } catch (err) {
                    console.error(err);
                    await interaction.editReply('❌ Ban listesi alınamadı.');
                }
            }

            // 🎫 BİLET OLUŞTURMA
            if (interaction.commandName === 'ticket') {
                const embed = new EmbedBuilder()
                    .setColor(0x00AE86)
                    .setTitle('🎫 Destek Talebi')
                    .setDescription('Butona tıklayarak destek talebi oluşturabilirsiniz.');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('bilet-ac')
                        .setLabel('📩 Bilet Aç')
                        .setStyle(ButtonStyle.Primary)
                );

                await interaction.reply({ embeds: [embed], components: [row] });
            }
        }

        // BUTONLAR ==============================

        // BİLET AÇMA
        if (interaction.isButton() && interaction.customId === 'bilet-ac') {
            const channel = await interaction.guild.channels.create({
                name: `bilet-${interaction.user.username}`,
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

            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('📩 Destek Talebi Açıldı')
                .setDescription('Yetkililer en kısa sürede sizinle ilgilenecektir.\n\nBiletinizi kapatmak için aşağıdaki butonu kullanabilirsiniz.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('bilet-kapat')
                    .setLabel('📪 Bileti Kapat')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Biletiniz açıldı: ${channel}`, ephemeral: true });
        }

        // BİLET KAPATMA + TRANSCRIPT
        if (interaction.isButton() && interaction.customId === 'bilet-kapat') {
            await interaction.reply({ content: '📪 Bilet kapatılıyor...', ephemeral: true });

            try {
                // Mesajları al
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                const content = messages
                    .map(m => `${m.author.tag}: ${m.content}`)
                    .reverse()
                    .join('\n');

                // Dosyaya yaz
                const filePath = `./transcript-${interaction.channel.id}.txt`;
                fs.writeFileSync(filePath, content);

                const attachment = new AttachmentBuilder(filePath);

                // Log kanalına gönder (ID'yi değiştirmen lazım)
                const logChannelId = "LOG_KANAL_ID"; 
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    await logChannel.send({ content: `📑 ${interaction.channel.name} transcript:`, files: [attachment] });
                }

                // Dosyayı sil (sunucuda yer kaplamasın)
                fs.unlinkSync(filePath);

                // Kanalı kapat
                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 2000);

            } catch (err) {
                console.error(err);
            }
        }
    }
};
