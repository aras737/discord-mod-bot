const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Yasaklı bir kullanıcının yasağını kaldırır')
        .addStringOption(option =>
            option.setName('kullanici_id')
                .setDescription('Yasağı kaldırılacak kullanıcının ID numarası')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasak kaldırma sebebi')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('kullanici_id');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        // ID formatı kontrolü
        if (!/^\d{17,19}$/.test(userId)) {
            return interaction.reply({ content: 'Geçersiz kullanıcı ID formatı.', ephemeral: true });
        }

        try {
            // Yasaklı kullanıcı kontrolü
            const bannedUser = await interaction.guild.bans.fetch(userId).catch(() => null);
            
            if (!bannedUser) {
                return interaction.reply({ content: 'Bu kullanıcı yasaklı değil veya bulunamadı.', ephemeral: true });
            }

            // Yasak kaldırma işlemi
            await interaction.guild.members.unban(userId, `${interaction.user.tag} tarafından yasağı kaldırıldı: ${reason}`);

            // Başarı mesajı
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Yasak Başarıyla Kaldırıldı')
                .addFields(
                    { name: 'Kullanıcı', value: `${bannedUser.user.tag} (${bannedUser.user.id})`, inline: true },
                    { name: 'Yetkili', value: interaction.user.tag, inline: true },
                    { name: 'Sebep', value: reason, inline: false },
                    { name: 'Tarih', value: new Date().toLocaleString('tr-TR'), inline: true }
                );

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Unban hatası:', error);
            await interaction.reply({ content: 'Yasak kaldırma işlemi sırasında bir hata oluştu.', ephemeral: true });
        }
    },
};

