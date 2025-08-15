const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Botun temel yönetim ayarlarını düzenler.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('isim-değiştir')
                .setDescription('Botun sunucudaki ismini değiştirir.')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Botun yeni ismi.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('açıklama-değiştir')
                .setDescription('Botun açıklamasını değiştirir.')
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Botun yeni açıklaması.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('başlat')
                .setDescription('Botu aktif hale getirir (durumunu değiştirir).'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('durdur')
                .setDescription('Botu pasif hale getirir (durumunu değiştirir).')),
    
    async execute(interaction) {
        // Bu komutu sadece bot sahibi kullanabilir.
        // 'BOT_SAHİBİ_ID' yerine kendi Discord ID'ni yazın.
        const ownerId = 'BOT_SAHİBİ_ID';
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'isim-değiştir':
                const newName = interaction.options.getString('isim');
                try {
                    await interaction.guild.members.me.setNickname(newName);
                    await interaction.reply({ content: `✅ Botun ismi başarıyla **${newName}** olarak değiştirildi.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Botun ismini değiştirirken bir hata oluştu.', ephemeral: true });
                }
                break;

            case 'açıklama-değiştir':
                const newAbout = interaction.options.getString('açıklama');
                try {
                    await interaction.client.user.setAboutMe(newAbout);
                    await interaction.reply({ content: `✅ Botun açıklaması başarıyla güncellendi.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Botun açıklamasını değiştirirken bir hata oluştu.', ephemeral: true });
                }
                break;

            case 'başlat':
                try {
                    await interaction.client.user.setPresence({
                        status: 'online', // 'online', 'dnd', 'idle' veya 'offline' olabilir
                        activities: [{ name: 'Görevinin başında!', type: 'PLAYING' }] // PLAYING, STREAMING, LISTENING, WATCHING
                    });
                    await interaction.reply({ content: '✅ Bot başarıyla başlatıldı ve durumu güncellendi.', ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Botu başlatırken bir hata oluştu.', ephemeral: true });
                }
                break;

            case 'durdur':
                try {
                    await interaction.client.user.setPresence({
                        status: 'idle',
                        activities: [{ name: 'Kapalı.', type: 'PLAYING' }]
                    });
                    await interaction.reply({ content: '✅ Bot durduruldu ve durumu güncellendi.', ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Botu durdururken bir hata oluştu.', ephemeral: true });
                }
                break;

            default:
                await interaction.reply({ content: 'Hatalı alt komut kullanımı.', ephemeral: true });
                break;
        }
    },
};
