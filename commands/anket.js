const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetki')
        .setDescription('Bu komutu sadece belirli bir role sahip olanlar kullanabilir.')
        .setDMPermission(false), // Komutun DM'de (özel mesajlarda) kullanılmasını engeller.

    async execute(interaction) {
        // Kontrol edilecek rolün adını buraya yazın
        const requiredRoleName = 'Yönetim Kurulu'; 
        
        // Kullanıcının gerekli role sahip olup olmadığını kontrol edin
        const hasRequiredRole = interaction.member.roles.cache.some(role => role.name === requiredRoleName);

        if (hasRequiredRole) {
            // Eğer kullanıcı gerekli role sahipse
            await interaction.reply({
                content: `Başarılı! **${requiredRoleName}** rolüne sahip olduğunuz için bu komutu kullanabilirsiniz.`,
                ephemeral: true // Sadece komutu kullanan kişiye görünür.
            });
        } else {
            // Eğer kullanıcı gerekli role sahip değilse
            await interaction.reply({
                content: `Bu komutu kullanmak için **${requiredRoleName}** rolüne sahip olmalısın.`,
                ephemeral: true
            });
        }
    }
};
