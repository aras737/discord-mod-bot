const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('otorol')
        .setDescription('Sunucuya katılan üyelere otomatik verilecek rolü ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Otomatik verilecek rolü seçin.')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const role = interaction.options.getRole('rol');

        // Yetki kontrolü
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: '❌ Roller yönetme yetkim yok!',
                ephemeral: true
            });
        }

        // Rol hiyerarşi kontrolü
        const botRole = interaction.guild.members.me.roles.highest;
        if (role.position >= botRole.position) {
            return interaction.reply({
                content: '❌ Bu rol, botun rolünden daha yüksek olduğu için ayarlanamaz!',
                ephemeral: true
            });
        }

        // Veritabanına kaydet
        await db.set(`otorol_${interaction.guild.id}`, role.id);

        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('✅ Otomatik Rol Ayarlandı')
            .setDescription(`Yeni katılan üyelere otomatik olarak şu rol verilecek:\n> ${role}`)
            .setFooter({ text: `Ayarlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: false });

        // EVENT: Yeni biri katıldığında rol ver
        client.on('guildMemberAdd', async member => {
            try {
                const otorolID = await db.get(`otorol_${member.guild.id}`);
                if (!otorolID) return;

                const rol = member.guild.roles.cache.get(otorolID);
                if (!rol) return;

                await member.roles.add(rol);
                console.log(`${member.user.tag} kullanıcısına oto rol verildi: ${rol.name}`);
            } catch (err) {
                console.error('Oto rol hatası:', err);
            }
        });
    }
};
