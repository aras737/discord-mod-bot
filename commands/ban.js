const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Belirtilen kullanıcıyı sunucudan yasaklar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Yasaklanacak kullanıcıyı seçin.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasaklama sebebi.')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        // ✅ Herkes görebilsin
        await interaction.deferReply({ ephemeral: false });

        if (!member) {
            return interaction.editReply({ content: 'Bu kullanıcı sunucuda bulunamadı.', ephemeral: false });
        }

        if (!member.bannable) {
            return interaction.editReply({ content: 'Bu kullanıcıyı yasaklamak için yeterli yetkim yok.', ephemeral: false });
        }

        await member.ban({ reason });

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Kullanıcı Yasaklandı')
            .addFields(
                { name: 'Kullanıcı', value: `${target.tag}`, inline: true },
                { name: 'ID', value: `${target.id}`, inline: true },
                { name: 'Sebep', value: `${reason}`, inline: false }
            )
            .setFooter({ text: `Yasaklayan: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], ephemeral: false });
    },
};
