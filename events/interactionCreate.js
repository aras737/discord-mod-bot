// events/interactionCreate.js
const { Events, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

function resolveStaffRoleIds(guild) {
    const allRoleNames = [...(config.roles?.ust || []), ...(config.roles?.orta || []), ...(config.roles?.alt || [])];
    const ids = new Set();
    for (const name of allRoleNames) {
        const role = guild.roles.cache.find(r => r.name === name);
        if (role) ids.add(role.id);
    }
    return [...ids];
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // === Slash komutları ===
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(err);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: '❌ Komut çalıştırılırken hata oluştu.', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ Komut çalıştırılırken hata oluştu.', ephemeral: true });
                }
            }
        }

        // === Butonlar ===
        if (interaction.isButton()) {
            const staffRoleIds = resolveStaffRoleIds(interaction.guild);

            // 🎫 Bilet oluşturma
            if (interaction.customId === 'create_ticket') {
                const existing = interaction.guild.channels.cache.find(c =>
                    c.type === ChannelType.GuildText &&
                    c.name.startsWith(`ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`)
                );
                if (existing) {
                    return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${existing}`, ephemeral: true });
                }

                const ch = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                    type: ChannelType.GuildText,
                    parent: interaction.channel.parent,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        ...staffRoleIds.map(rid => ({ id: rid, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }))
                    ]
                });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('🔒 Kapat')
                        .setStyle(ButtonStyle.Danger)
                );

                await ch.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🎫 Destek Talebi')
                            .setDescription('Merhaba! Sorununu/isteğini detaylı yaz. Yetkililer kısa sürede yardımcı olacak.')
                            .setColor('Blue')
                            .setFooter({ text: `Açan: ${interaction.user.tag}` })
                            .setTimestamp()
                    ],
                    components: [row]
                });

                await interaction.reply({ content: `✅ Bilet oluşturuldu: ${ch}`, ephemeral: true });
            }

            // 🎫 Bilet kapatma
            if (interaction.customId === 'ticket_close') {
                if (!interaction.member.roles.cache.some(r => staffRoleIds.includes(r.id))) {
                    return interaction.reply({ content: '❌ Bu butonu sadece yetkililer kullanabilir.', ephemeral: true });
                }
                if (!interaction.channel.name.startsWith('ticket-')) {
                    return interaction.reply({ content: '❌ Bu işlem sadece bilet kanallarında yapılabilir.', ephemeral: true });
                }
                await interaction.reply({ content: '⏳ Bilet 5 saniye içinde kapatılacak.', ephemeral: true });
                setTimeout(() => interaction.channel.delete(), 5000);
            }
        }

        // === Modal işlemleri ===
        if (interaction.isModalSubmit() && interaction.customId === 'kamp_basvuru_formu') {
            const robloxIsim = interaction.fields.getTextInputValue('robloxIsim');
            const discordIsim = interaction.fields.getTextInputValue('discordIsim');
            const kamplar = interaction.fields.getTextInputValue('gelinenKamplar');
            const grupUyeSayilari = interaction.fields.getTextInputValue('grupUyeSayilari');
            const tkaDurum = interaction.fields.getTextInputValue('tkaDurumu');
            const robloxGrupUyeligi = interaction.fields.getTextInputValue('robloxGrupUyeligi');
            const ssKanit = interaction.fields.getTextInputValue('ssKanit');

            const resultEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('📝 Yeni Kamp Başvurusu')
                .setDescription(`**Başvuran:** <@${interaction.user.id}> (${interaction.user.tag})`)
                .addFields(
                    { name: 'Roblox İsmi', value: robloxIsim, inline: true },
                    { name: 'Discord İsmi', value: discordIsim, inline: true },
                    { name: 'Geldiği Kamplar', value: kamplar },
                    { name: 'Grup Üye Sayıları', value: grupUyeSayilari },
                    { name: 'TKA Durumu', value: tkaDurum },
                    { name: 'Roblox Grup Üyeliği', value: robloxGrupUyeligi },
                    { name: 'SS/Kanıt', value: ssKanit }
                )
                .setTimestamp();

            const logChannelId = 'BASVURU_LOG_KANAL_IDSI';
            try {
                const logChannel = await interaction.guild.channels.fetch(logChannelId);
                if (logChannel) {
                    await logChannel.send({ embeds: [resultEmbed] });
                    await interaction.reply({ content: '✅ Başvurunuz başarıyla gönderildi!', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ Başvuru kanalı bulunamadı.', ephemeral: true });
                }
            } catch (err) {
                console.error(err);
                await interaction.reply({ content: '❌ Başvurunuz gönderilirken hata oluştu.', ephemeral: true });
            }
        }
    }
};
