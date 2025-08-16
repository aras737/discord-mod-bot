const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder, Events } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kampbasvuru')
        .setDescription('Kampa katılım için bir başvuru formu açar.'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('kamp_basvuru_formu')
            .setTitle('Kampa Katılım Başvuru Formu');

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

        const grupUyeSayilariInput = new TextInputBuilder()
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
            
        const robloxGrupUyeligiInput = new TextInputBuilder()
            .setCustomId('robloxGrupUyeligi')
            .setLabel("Kampların Roblox grubunda yer alıyor musunuz?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Evet / Hayır")
            .setRequired(true);

        const ssKanitInput = new TextInputBuilder()
            .setCustomId('ssKanit')
            .setLabel("SS/Kanıt (Her kamp için iki SS linki)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(robloxIsimInput),
            new ActionRowBuilder().addComponents(discordIsimInput),
            new ActionRowBuilder().addComponents(kamplarInput),
            new ActionRowBuilder().addComponents(grupUyeSayilariInput),
            new ActionRowBuilder().addComponents(tkaDurumInput),
            new ActionRowBuilder().addComponents(robloxGrupUyeligiInput),
            new ActionRowBuilder().addComponents(ssKanitInput)
        );

        await interaction.showModal(modal);
    },
};

module.exports.setupModalListener = (client) => {
    client.on(Events.InteractionCreate, async modalInteraction => {
        if (!modalInteraction.isModalSubmit() || modalInteraction.customId !== 'kamp_basvuru_formu') {
            return;
        }

        const robloxIsim = modalInteraction.fields.getTextInputValue('robloxIsim');
        const discordIsim = modalInteraction.fields.getTextInputValue('discordIsim');
        const kamplar = modalInteraction.fields.getTextInputValue('gelinenKamplar');
        const grupUyeSayilari = modalInteraction.fields.getTextInputValue('grupUyeSayilari');
        const tkaDurum = modalInteraction.fields.getTextInputValue('tkaDurumu');
        const robloxGrupUyeligi = modalInteraction.fields.getTextInputValue('robloxGrupUyeligi');
        const ssKanit = modalInteraction.fields.getTextInputValue('ssKanit');

        const resultEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📝 Yeni Kamp Başvurusu')
            .setDescription(`**Başvuran:** <@${modalInteraction.user.id}> (${modalInteraction.user.tag})`)
            .addFields(
                { name: 'Roblox İsmi', value: robloxIsim, inline: true },
                { name: 'Discord İsmi', value: discordIsim, inline: true },
                { name: 'Geldiği Kamplar', value: kamplar },
                { name: 'Grup Üye Sayıları', value: grupUyeSayilari },
                { name: 'Daha Önce TKA Ordusunda Bulundu mu?', value: tkaDurum },
                { name: 'Roblox Grup Üyeliği', value: robloxGrupUyeligi },
                { name: 'SS/Kanıt', value: ssKanit }
            )
            .setTimestamp();

        const logChannelId = 'BASVURU_LOG_KANAL_IDSI';
        try {
            const logChannel = await modalInteraction.guild.channels.fetch(logChannelId);
            if (logChannel) {
                await logChannel.send({ embeds: [resultEmbed] });
                await modalInteraction.reply({ content: 'Başvurunuz başarıyla gönderildi!', ephemeral: true });
            } else {
                 await modalInteraction.reply({ content: `❌ Başvuru kanalı bulunamadı. Lütfen "BASVURU_LOG_KANAL_IDSI" değerini doğru girdiğinizden emin olun.`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await modalInteraction.reply({ content: 'Başvurunuz gönderilirken bir hata oluştu.', ephemeral: true });
        }
    });
};
