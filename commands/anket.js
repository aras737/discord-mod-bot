const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetki-ata')
        .setDescription('Tüm bot komutlarını kullanabilecek yetkili rolü belirler.')
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Yetkiyi atamak istediğiniz rol.')
                .setRequired(true)
        )
        // Bu komutu sadece Yönetici yetkisine sahip kullanıcılar kullanabilir.
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const selectedRole = interaction.options.getRole('rol');
        const configPath = './yetkili_rol.json';

        try {
            // Rol ID'sini bir JSON dosyasına kaydedin
            fs.writeFileSync(configPath, JSON.stringify({ authorizedRoleId: selectedRole.id }));
            
            await interaction.reply({
                content: `✅ Başarılı! Artık **${selectedRole.name}** rolüne sahip olanlar tüm bot komutlarını kullanabilir.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Yetkili rolü kaydederken hata oluştu:', error);
            await interaction.reply({
                content: 'Rolü kaydederken bir hata oluştu.',
                ephemeral: true
            });
        }
    }
};
