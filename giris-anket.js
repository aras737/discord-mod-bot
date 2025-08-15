// Bu kodu, botunun ana dosyasına (örneğin, index.js) ekle.
// discord.js'in Modal, TextInput, vb. özelliklerini kullanabilmek için
// kütüphaneleri doğru şekilde tanımladığından emin ol.
const { Events, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    // Sunucuya yeni bir üye katıldığında çalışacak olay dinleyicisi
    client.on(Events.GuildMemberAdd, async member => {
        // Anketi göndereceğimiz üye
        const user = member.user;

        // Anket modalını oluştur
        const anketModal = new ModalBuilder()
            .setCustomId('uye_anketi')
            .setTitle('Sunucuya Hoş Geldin Anketi!');

        // 1. soru: Nereden Geliyorsun?
        const neredenInput = new TextInputBuilder()
            .setCustomId('nereden_geliyorsun')
            .setLabel("Nereden Geliyorsun?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Örn: Türkiye, Almanya, vb.')
            .setRequired(true);

        // 2. soru: Bizi nereden buldun?
        const neredenBuldunInput = new TextInputBuilder()
            .setCustomId('nereden_buldun')
            .setLabel("Sunucuyu nereden öğrendin?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Örn: Roblox, YouTube, Arkadaşım, vb.')
            .setRequired(true);

        // 3. soru: Sunucuda ne arıyorsun?
        const neAriyorInput = new TextInputBuilder()
            .setCustomId('ne_ariyor')
            .setLabel("Sunucuda ne arıyorsun?")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Örn: Oyun oynamak, sohbet etmek, TSK hakkında bilgi almak, vb.')
            .setRequired(false);

        // Her soru için bir ActionRow oluştur
        const firstRow = new ActionRowBuilder().addComponents(neredenInput);
        const secondRow = new ActionRowBuilder().addComponents(neredenBuldunInput);
        const thirdRow = new ActionRowBuilder().addComponents(neAriyorInput);

        // Modala soruları ekle
        anketModal.addComponents(firstRow, secondRow, thirdRow);

        try {
            // Üyeye DM (özel mesaj) olarak anketi gönder
            await user.send({
                content: 'Selam! Sunucumuza hoş geldin. Seni daha iyi tanıyabilmemiz için birkaç soruyu cevaplar mısın?',
                components: [anketModal.components[0]] // Modal'ı doğrudan component olarak gönderemezsin, bu yüzden bu yapıyı kullan
            });
            await user.send({ components: [anketModal.components[1]] });
            await user.send({ components: [anketModal.components[2]] });
        } catch (error) {
            console.error(`Anket gönderilemedi: ${user.tag}. Hata: ${error.message}`);
            // DM'leri kapalıysa, log kanalı gibi bir yere not düşebilirsin.
            // Örnek:
            // const logChannel = member.guild.channels.cache.get('LOG_KANAL_ID');
            // if (logChannel) {
            //     logChannel.send(`Anket ${user.tag} üyesine DM'leri kapalı olduğu için gönderilemedi.`);
            // }
        }
    });

    // Kullanıcı anket formunu doldurup gönderdiğinde çalışacak olay dinleyicisi
    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isModalSubmit() || interaction.customId !== 'uye_anketi') {
            return;
        }

        // Anketin yanıtlarını al
        const nereden = interaction.fields.getTextInputValue('nereden_geliyorsun');
        const neredenBuldun = interaction.fields.getTextInputValue('nereden_buldun');
        const neAriyor = interaction.fields.getTextInputValue('ne_ariyor');

        // Anket sonuçlarını bir embed mesajı ile log kanalı veya konsola gönder
        const anketLogEmbed = new EmbedBuilder()
            .setTitle('📝 Yeni Üye Anketi Yanıtı')
            .setColor('#00AE86')
            .addFields(
                { name: 'Üye', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                { name: 'Katılma Tarihi', value: `<t:${Math.floor(interaction.member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Nereden Geliyor?', value: nereden },
                { name: 'Nereden Buldu?', value: neredenBuldun },
                { name: 'Ne Arıyor?', value: neAriyor || 'Yanıt verilmedi.' }
            )
            .setTimestamp();

        // Anket sonuçlarını göndereceğin kanalın ID'si
        const logChannelId = 'LOG_KANAL_ID'; // Burayı anket sonuçlarının loglanacağı kanal ID'si ile değiştir

        try {
            const logChannel = await interaction.guild.channels.fetch(logChannelId);
            if (logChannel) {
                await logChannel.send({ embeds: [anketLogEmbed] });
            }

            // Üyeye anketini tamamladığına dair teşekkür mesajı gönder
            await interaction.reply({ content: 'Anketi tamamladığın için teşekkürler! Sunucuda iyi eğlenceler.', ephemeral: true });
        } catch (error) {
            console.error('Anket sonucu loglanırken bir hata oluştu:', error);
            await interaction.reply({ content: 'Anket yanıtın gönderilirken bir hata oluştu.', ephemeral: true });
        }
    });
};
