const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB(); // Veritabanı başlatılır

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetki-ver')
        .setDescription('Bir role bot komutlarını kullanma yetki seviyesi verir.')
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Yetki vermek istediğiniz rol.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('seviye')
                .setDescription('Verilecek yetki seviyesi')
                .setRequired(true)
                .addChoices(
                    { name: 'Üye (0)', value: '0' },
                    { name: 'Admin (1)', value: '1' },
                    { name: 'Yönetici (2)', value: '2' },
                    { name: 'Kurucu (3)', value: '3' },
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        const role = interaction.options.getRole('rol');
        const level = interaction.options.getString('seviye');

        try {
            // Rolün yetki seviyesini veritabanına kaydet
            await db.set(`role_permission_${role.id}`, Number(level));

            // Başarılı mesaj
            await interaction.reply({
                content: `✅ **${role.name}** rolüne **${level}. seviye** yetkisi başarıyla atandı.`,
                flags: 64 // ephemeral (sadece komutu kullanan görür)
            });
        } catch (error) {
            console.error(error);

            await interaction.reply({
                content: '❌ Rol yetkisini atarken bir hata oluştu.',
                flags: 64
            });
        }
    },
};
