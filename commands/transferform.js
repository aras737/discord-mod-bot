const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder, Events } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kampbasvuru')
        .setDescription('Kampa katılım için bir başvuru formu açar.'),
    async execute(interaction) {
        // Modal penceresini oluştur
        const modal = new ModalBuilder()
            .setCustomId('kamp_basvuru_formu')
            .setTitle('Kampa Katılım Başvuru Formu');

        // Formdaki soruları oluştur
        const robloxIsimInput = new TextInputBuilder()
            .setCustomId('robloxIsim')
            .setLabel("Roblox İsminiz?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const discordIsimInput = new TextInputBuilder()
            .setCustomId('discordIsim')
            .setLabel("Discord İsminiz?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        const kamplarInput = new TextInputBuilder()
            .setCustomId('gelinenKamplar')
            .setLabel("Hangi kamplardan geliyorsunuz? [HEPSİNİ SAY]")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const grupSayilariInput = new TextInputBuilder()
            .setCustomId('grupUyeSayilari')
            .setLabel("Geldiğiniz kampların grup üye sayıları?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const tkaDurumInput = new TextInputBuilder()
            .setCustomId('tkaDurumu')
            .setLabel("Daha önce TKA ordusunda bulundunuz mu?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Evet / Hayır")
            .setRequired(true);
            
        // Soruları modal'a eklemek için ActionRow kullan
        modal.addComponents(
            new ActionRowBuilder().addComponents(robloxIsimInput),
            new ActionRowBuilder().addComponents(discordIsimInput),
            new ActionRowBuilder().addComponents(kamplarInput),
            new ActionRowBuilder().addComponents(grupSayilariInput),
            new ActionRowBuilder().addComponents(tkaDurumInput)
        );

        // Kullanıcıya modal'ı göster
        await interaction.showModal(modal);
    },
};

// Bu kısım, modal gönderildiğinde çalışacak
module.exports.setupModalListener = (client) => {
    client.on(Events.InteractionCreate, async modalInteraction => {
        if (!modalInteraction.isModalSubmit() || modalInteraction.customId !== 'kamp_basvuru_formu') {
            return;
        }

        // Formdan gelen yanıtları al
        const robloxIsim = modalInteraction.fields.getTextInputValue('robloxIsim');
        const discordIsim = modalInteraction.fields.getTextInputValue('discordIsim');
        const kamplar = modalInteraction.fields.getTextInputValue('gelinenKamplar');
        const grupSayilari = modalInteraction.fields.getTextInputValue('grupUyeSayilari');
        const tkaDurum = modalInteraction.fields.getTextInputValue('tkaDurumu');

        // Sonuçları bir Embed mesajı olarak hazırla
        const resultEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📝 Yeni Kamp Başvurusu')
            .setDescription(`**Başvuran:** <@${modalInteraction.user.id}> (${modalInteraction.user.tag})`)
            .addFields(
                { name: 'Roblox İsmi', value: robloxIsim, inline: true },
                { name: 'Discord İsmi', value: discordIsim, inline: true },
                { name: 'Geldiği Kamplar', value: kamplar },
                { name: 'Grup Üye Sayıları', value: grupSayilari },
                { name: 'Daha Önce TKA Ordusunda Bulundu mu?', value: tkaDurum }
            )
            .setTimestamp();

        // Başvuruların gönderileceği kanalın ID'si. BURAYI DEĞİŞTİR!
        const logChannelId = 'BASVURU_LOG_KANAL_IDSI';
        const logChannel = await modalInteraction.guild.channels.fetch(logChannelId);

        if (logChannel) {
            await logChannel.send({ embeds: [resultEmbed] });
            await modalInteraction.reply({ content: 'Başvurunuz başarıyla gönderildi!', ephemeral: true });
        } else {
            await modalInteraction.reply({ content: 'Başvurunuz gönderilirken bir hata oluştu.', ephemeral: true });
        }
    });
};
