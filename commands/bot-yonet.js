const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botuyonet')
        .setDescription('Botu yönetmenizi sağlar (sadece yetkililer).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Yetki kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Bu komutu kullanmak için yönetici olmalısın!', flags: 64 });
        }

        // Embed
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Yönetim Paneli')
            .setDescription('Aşağıdaki butonlarla botu yönetebilirsin.')
            .setColor('Purple')
            .setFooter({ text: `Komutu kullanan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // Butonlar
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('restart_bot')
                .setLabel('🔄 Yeniden Başlat')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('shutdown_bot')
                .setLabel('🛑 Durdur')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('show_logs')
                .setLabel('📜 Logları Göster')
                .setStyle(ButtonStyle.Secondary)
        );

        // Mesaj gönder
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });

        // Buton Eventleri
        const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ Bu butonları sadece komutu kullanan yönetebilir.', flags: 64 });
            }

            if (i.customId === 'restart_bot') {
                await i.reply({ content: '♻ Bot yeniden başlatılıyor...', flags: 64 });
                process.exit(0);
            }
            if (i.customId === 'shutdown_bot') {
                await i.reply({ content: '🛑 Bot durduruluyor...', flags: 64 });
                process.exit(1);
            }
            if (i.customId === 'show_logs') {
                await i.reply({ content: '📜 Son loglar: (buraya log sistemi eklenebilir)', flags: 64 });
            }
        });
    }
};
