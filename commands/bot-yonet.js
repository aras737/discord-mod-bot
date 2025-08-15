const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField, ComponentType, EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Botun temel yönetim ayarlarını butonlarla düzenler.'),
    
    async execute(interaction) {
        // Bu komutu sadece bot sahibi kullanabilir.
        // '1389930042200559706' yerine kendi Discord kullanıcı kimliğini (ID) yaz.
        const ownerId = '1389930042200559706'; 
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        const renameButton = new ButtonBuilder()
            .setCustomId('bot_isim_degistir')
            .setLabel('İsim Değiştir')
            .setStyle(ButtonStyle.Primary);

        const aboutButton = new ButtonBuilder()
            .setCustomId('bot_aciklama_degistir')
            .setLabel('Açıklama Değiştir')
            .setStyle(ButtonStyle.Secondary);
            
        const startButton = new ButtonBuilder()
            .setCustomId('bot_baslat')
            .setLabel('Durumu Başlat')
            .setStyle(ButtonStyle.Success);

        const stopButton = new ButtonBuilder()
            .setCustomId('bot_durdur')
            .setLabel('Durumu Durdur')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(renameButton, aboutButton, startButton, stopButton);

        await interaction.reply({
            content: 'Lütfen yapmak istediğiniz işlemi seçin:',
            components: [row],
            ephemeral: true
        });

        // Buton etkileşimlerini dinle
        const collector = interaction.channel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000, 
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async i => {
            await i.deferUpdate(); // Butona basıldığında yükleniyor göstergesi verir

            if (i.customId === 'bot_isim_degistir') {
                const modal = new ModalBuilder()
                    .setCustomId('bot_isim_modal')
                    .setTitle('Botun İsmini Değiştir');
    
                const nameInput = new TextInputBuilder()
                    .setCustomId('isim_input')
                    .setLabel('Botun yeni ismi')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
    
                modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                await i.showModal(modal);

            } else if (i.customId === 'bot_aciklama_degistir') {
                const modal = new ModalBuilder()
                    .setCustomId('bot_aciklama_modal')
                    .setTitle('Botun Açıklamasını Değiştir');
    
                const aboutInput = new TextInputBuilder()
                    .setCustomId('aciklama_input')
                    .setLabel('Botun yeni açıklaması')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);
    
                modal.addComponents(new ActionRowBuilder().addComponents(aboutInput));
                await i.showModal(modal);

            } else if (i.customId === 'bot_baslat') {
                try {
                    await interaction.client.user.setPresence({
                        status: 'online',
                        activities: [{ name: 'Görevinin başında!', type: 'PLAYING' }]
                    });
                    await i.followUp({ content: '✅ Bot başarıyla başlatıldı ve durumu güncellendi.', ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await i.followUp({ content: '❌ Botu başlatırken bir hata oluştu.', ephemeral: true });
                }
                
            } else if (i.customId === 'bot_durdur') {
                try {
                    await interaction.client.user.setPresence({
                        status: 'idle',
                        activities: [{ name: 'Kapalı.', type: 'PLAYING' }]
                    });
                    await i.followUp({ content: '✅ Bot durduruldu ve durumu güncellendi.', ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await i.followUp({ content: '❌ Botu durdururken bir hata oluştu.', ephemeral: true });
                }
            }
        });

        // Modal etkileşimlerini dinle
        interaction.client.on('interactionCreate', async modalInteraction => {
            if (!modalInteraction.isModalSubmit()) return;
            if (modalInteraction.user.id !== ownerId) return;

            if (modalInteraction.customId === 'bot_isim_modal') {
                const newName = modalInteraction.fields.getTextInputValue('isim_input');
                try {
                    await interaction.guild.members.me.setNickname(newName);
                    await modalInteraction.reply({ content: `✅ Botun ismi başarıyla **${newName}** olarak değiştirildi.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await modalInteraction.reply({ content: '❌ Botun ismini değiştirirken bir hata oluştu.', ephemeral: true });
                }

            } else if (modalInteraction.customId === 'bot_aciklama_modal') {
                const newAbout = modalInteraction.fields.getTextInputValue('aciklama_input');
                try {
                    await interaction.client.user.setAboutMe(newAbout);
                    await modalInteraction.reply({ content: `✅ Botun açıklaması başarıyla güncellendi.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await modalInteraction.reply({ content: '❌ Botun açıklamasını değiştirirken bir hata oluştu.', ephemeral: true });
                }
            }
        });

        collector.on('end', collected => {
            // Eğer kimse butona basmazsa, mesajı pasif hale getir
            if (collected.size === 0) {
                interaction.editReply({ content: 'İşlem zaman aşımına uğradı.', components: [] });
            }
        });
    }
};
