const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetki')
        .setDescription('Sunucudaki tüm rolleri ve yetkilerini listeler.'),

    async execute(interaction) {
        // Sadece yöneticilerin bu komutu kullanmasına izin verin.
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const roles = interaction.guild.roles.cache.sort((a, b) => b.position - a.position);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Sunucudaki Rollerin Yetki Bilgileri')
            .setTimestamp()
            .setFooter({ text: `Komutu kullanan: ${interaction.user.tag}` });

        roles.forEach(role => {
            if (role.name === '@everyone') return;

            const permissions = role.permissions;
            const permissionList = [];

            if (permissions.has(PermissionFlagsBits.Administrator)) {
                permissionList.push('Yönetici (Tüm Yetkiler)');
            } else {
                if (permissions.has(PermissionFlagsBits.KickMembers)) permissionList.push('Üyeleri Atma');
                if (permissions.has(PermissionFlagsBits.BanMembers)) permissionList.push('Üyeleri Yasaklama');
                if (permissions.has(PermissionFlagsBits.ManageChannels)) permissionList.push('Kanalları Yönetme');
            }

            const formattedPermissions = permissionList.length > 0
                ? permissionList.join(', ')
                : 'Belirtilen yetkilere sahip değil.';

            // Her rol için ayrı bir alan (field) ekleyin.
            embed.addFields({
                name: role.name,
                value: `**Yetkiler:** ${formattedPermissions}\n**Üye Sayısı:** ${role.members.size}`,
                inline: false
            });
        });

        // 25'ten fazla alan (field) varsa, birden fazla gömülü mesaj (embed) göndermeyi düşünmelisiniz.
        if (embed.data.fields && embed.data.fields.length > 25) {
             embed.setDescription('Çok fazla rol olduğu için ilk 25 rol listelenmiştir.');
             embed.data.fields = embed.data.fields.slice(0, 25);
        }

        await interaction.reply({ embeds: [embed] });
    }
};

