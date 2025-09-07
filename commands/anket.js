const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('quick.db');

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
                .setDescription('Verilecek yetki seviyesi (0: Herkes, 1: Admin, 2: Yönetici, 3: Kurucu)')
                .setRequired(true)
                .addChoices(
                    { name: 'Üye', value: '0' },
                    { name: 'Admin', value: '1' },
                    { name: 'Yönetici', value: '2' },
                    { name: 'Kurucu', value: '3' },
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Bu komutu sadece yöneticiler kullanabilir
        .setDMPermission(false),

    async execute(interaction) {
        const role = interaction.options.getRole('rol');
        const level = interaction.options.getString('seviye');

        // quick.db kullanarak rol ID'sini ve yetki seviyesini kaydet
        db.set(`role_permission_${role.id}`, parseInt(level));

        await interaction.reply({
            content: `✅ **${role.name}** rolüne **${level}. seviye** yetkisi başarıyla atandı.`,
            ephemeral: true
        });
    },
};
