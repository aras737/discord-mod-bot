const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetki-listesi')
        .setDescription('Sunucudaki tüm rolleri ve sahip oldukları temel yetkileri listeler.')
        .setDMPermission(false), // Komutun DM'de (özel mesajlarda) kullanılmasını engeller.

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const roles = interaction.guild.roles.cache
                .filter(role => role.name !== '@everyone')
                .sort((a, b) => b.position - a.position);

            const roleEmbeds = [];
            const chunkSize = 25;

            for (let i = 0; i < roles.size; i += chunkSize) {
                const chunk = roles.slice(i, i + chunkSize);
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Sunucudaki Rollerin Yetki Bilgileri (${i + 1}-${Math.min(i + chunkSize, roles.size)})`)
                    .setTimestamp()
                    .setFooter({ text: `Komutu Kullanan: ${interaction.user.tag}` });

                chunk.forEach(role => {
                    const permissions = role.permissions;
                    const permissionList = [];

                    if (permissions.has(PermissionFlagsBits.Administrator)) {
                        permissionList.push('Yönetici (Tüm Yetkiler)');
                    } else {
                        if (permissions.has(PermissionFlagsBits.KickMembers)) permissionList.push('Üyeleri Atma');
                        if (permissions.has(PermissionFlagsBits.BanMembers)) permissionList.push('Üyeleri Yasaklama');
                        if (permissions.has(PermissionFlagsBits.ManageChannels)) permissionList.push('Kanalları Yönetme');
                        if (permissions.has(PermissionFlagsBits.ManageRoles)) permissionList.push('Rolleri Yönetme');
                        if (permissions.has(PermissionFlagsBits.ManageGuild)) permissionList.push('Sunucuyu Yönetme');
                        if (permissions.has(PermissionFlagsBits.ManageMessages)) permissionList.push('Mesajları Yönetme');
                        if (permissions.has(PermissionFlagsBits.ModerateMembers)) permissionList.push('Üyeleri Engelleme/Susturma');
                        if (permissions.has(PermissionFlagsBits.MentionEveryone)) permissionList.push('@everyone/@here Etiketleme');
                    }

                    const formattedPermissions = permissionList.length > 0
                        ? permissionList.join(', ')
                        : 'Belirtilen temel yetkilere sahip değil.';

                    embed.addFields({
                        name: role.name,
                        value: `**Yetkiler:** ${formattedPermissions}\n**Üye Sayısı:** ${role.members.size}`,
                        inline: false
                    });
                });
                roleEmbeds.push(embed);
            }

            if (roleEmbeds.length > 0) {
                await interaction.editReply({ embeds: roleEmbeds });
            } else {
                await interaction.editReply({ content: 'Sunucuda listelenebilecek bir rol bulunamadı.', ephemeral: true });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Komutu çalıştırırken bir hata oluştu.', ephemeral: true });
        }
    }
};
