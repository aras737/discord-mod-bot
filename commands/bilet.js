const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

// Bot tokeninizi buraya yapıştırın.
const BOT_TOKEN = 'SİZİN_BOT_TOKENİNİZ';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
});

// Bilet açma mesajını gönderen komut
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ticketsetup') {
        // Embed mesajı oluşturma
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Destek Bileti Oluştur')
            .setDescription('Destek talebi oluşturmak için aşağıdaki butona tıklayın.')
            .setFooter({ text: '7/24 Destek Ekibi' });

        // Butonu oluşturma
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('Bilet Aç')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫'),
            );

        message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

// Buton etkileşimlerini dinleme
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Bilet açma butonu
    if (interaction.customId === 'open_ticket') {
        // Bilet kanalını oluşturma
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: 'BİLET_KANALLARININ_KATEGORİ_ID_Sİ', // Biletlerin gideceği kategori ID'si
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: 'MODERATÖR_ROLÜNÜN_ID_Sİ', // Moderatör rolünün ID'si
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
            ],
        });

        // Kullanıcıya bilet açtığını bildir
        interaction.reply({ content: `Biletiniz açıldı: ${channel}`, ephemeral: true });

        // Bilet kanalındaki mesajı oluşturma
        const ticketEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Yeni Destek Bileti')
            .setDescription(`Merhaba ${interaction.user}! Destek ekibimiz size en kısa sürede yardımcı olacaktır.`)
            .addFields(
                { name: 'Kullanıcı', value: `${interaction.user.tag}` }
            );

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Bileti Kapat')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒'),
            );

        channel.send({
            embeds: [ticketEmbed],
            components: [closeButton]
        });
    }

    // Bilet kapatma butonu
    if (interaction.customId === 'close_ticket') {
        // Yalnızca moderatörlerin veya bilet sahibinin kapatmasını sağlama
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && interaction.channel.name.split('-')[1] !== interaction.user.username) {
            return interaction.reply({ content: 'Bu bileti kapatma yetkiniz yok.', ephemeral: true });
        }

        // Bileti kapatmadan önce onay alma
        const confirmButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_close')
                    .setLabel('Onayla')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_close')
                    .setLabel('İptal')
                    .setStyle(ButtonStyle.Secondary),
            );

        interaction.reply({ content: 'Bileti kapatmak istediğinizden emin misiniz?', components: [confirmButton], ephemeral: true });
    }

    if (interaction.customId === 'confirm_close') {
        const channel = interaction.channel;
        interaction.reply('Bilet kapatılıyor...').then(() => {
            setTimeout(() => channel.delete(), 5000); // 5 saniye sonra kanalı sil
        });
    }

    if (interaction.customId === 'cancel_close') {
        interaction.update({ content: 'Bilet kapatma işlemi iptal edildi.', components: [] });
    }
});

client.login(BOT_TOKEN);
