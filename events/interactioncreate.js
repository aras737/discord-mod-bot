const { 
    PermissionsBitField, 
    EmbedBuilder, 
    ChannelType 
} = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        // SLASH KOMUTLAR
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
        }

        // BUTON: BİLET KAPAT
        if (interaction.isButton() && interaction.customId === 'bilet-kapat') {
            await interaction.reply({ content: '📪 Bilet kapatılıyor...', ephemeral: true });
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 2000);
        }
    }
};
