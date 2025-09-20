const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı sunucudan yasaklar')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Yasaklanacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasaklama sebebi')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('mesaj_sil')
                .setDescription('Kaç günlük mesajları silinsin (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
        const deleteMessageDays = interaction.options.getInteger('mesaj_sil') || 0;

        // Hedef kullanıcı kontrolü
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: 'Kendinizi yasaklayamazsınız.', ephemeral: true });
        }

        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({ content: 'Botu yasaklayamazsınız.', ephemeral: true });
        }

        // Üye kontrolü ve yetki kontrolü
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        if (targetMember) {
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({ content: 'Bu kullanıcıyı yasaklamak için yeterli yetkiniz yok.', ephemeral: true });
            }

            if (!targetMember.bannable) {
                return interaction.reply({ content: 'Bu kullanıcı yasaklanamaz.', ephemeral: true });
            }
        }

        try {
            // Kullanıcıya özel mesaj gönderme
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Sunucudan Yasaklandınız')
                    .addFields(
                        { name: 'Sunucu', value: interaction.guild.name, inline: true },
                        { name: 'Yetkili', value: interaction.user.tag, inline: true },
                        { name: 'Sebep', value: reason, inline: false },
                        { name: 'Tarih', value: new Date().toLocaleString('tr-TR'), inline: true }
                    );

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Kullanıcıya DM gönderilemedi');
            }

            // Yasaklama işlemi
            await interaction.guild.members.ban(targetUser, {
                deleteMessageDays: deleteMessageDays,
                reason: `${interaction.user.tag} tarafından yasaklandı: ${reason}`
            });

            // Başarı mesajı
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Kullanıcı Başarıyla Yasaklandı')
                .addFields(
                    { name: 'Yasaklanan Kullanıcı', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Yetkili', value: interaction.user.tag, inline: true },
                    { name: 'Sebep', value: reason, inline: false },
                    { name: 'Silinen Mesajlar', value: `${deleteMessageDays} günlük`, inline: true },
                    { name: 'Tarih', value: new Date().toLocaleString('tr-TR'), inline: true }
                );

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Ban hatası:', error);
            await interaction.reply({ content: 'Yasaklama işlemi sırasında bir hata oluştu.', ephemeral: true });
        }
    },
};
