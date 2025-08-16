const { Client, GatewayIntentBits, Collection, Partials,
    SlashCommandBuilder, REST, Routes,
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// BOT AYARLARI
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// === SLASH KOMUTLARI ===
const commands = [
    new SlashCommandBuilder()
        .setName('bilet')
        .setDescription('Bilet sistemi menüsünü açar.')
].map(command => command.toJSON());

// === KOMUT KAYDETME ===
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('📤 Slash komutları yükleniyor...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Slash komutları başarıyla yüklendi.');
    } catch (error) {
        console.error(error);
    }
})();

// === BOT AKTİF OLDU ===
client.once('ready', () => {
    console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);
});

// === SLASH KOMUT ÇALIŞTIRMA ===
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'bilet') {
            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('🎫 TKA Bilet Sistemi')
                .setDescription(
                    "Destek almak için aşağıdaki **Butona** basınız.\n\n" +
                    "📌 Kurallar:\n" +
                    "1️⃣ Spam yapmayınız.\n" +
                    "2️⃣ Açtığınız bilete sadece sizin ve yetkililerin erişimi olur.\n" +
                    "3️⃣ Gereksiz yere bilet açmayınız."
                )
                .setFooter({ text: 'TKA Destek Sistemi' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket-create')
                    .setLabel('🎟️ Bilet Aç')
                    .setStyle(ButtonStyle.Success)
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    // === BUTON İŞLEMLERİ ===
    if (interaction.isButton()) {
        // 🎟️ Bilet Aç
        if (interaction.customId === 'ticket-create') {
            const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
            if (existing) {
                return interaction.reply({ content: '❌ Zaten açık bir biletiniz var.', ephemeral: true });
            }

            const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.id}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
        {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
            id: interaction.user.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
            ],
        },
        {
            id: client.user.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ManageChannels
            ],
        },
        {
            id: "123456789012345678", // ✅ buraya kendi YETKILI rolünün ID’sini koy
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
            ],
        }
    ],
});

            const embed = new EmbedBuilder()
                .setColor(0xffd000)
                .setTitle('🎟️ Yeni Bilet')
                .setDescription(`Merhaba ${interaction.user}, destek ekibi en kısa sürede sizinle ilgilenecek.`)
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket-close')
                    .setLabel('❌ Bileti Kapat')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `<@&YETKILI_ROL_ID> | ${interaction.user}`, embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Biletiniz açıldı: ${channel}`, ephemeral: true });
        }

        // ❌ Bilet Kapat
        if (interaction.customId === 'ticket-close') {
            const channel = interaction.channel;
            if (!channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: '❌ Bu buton sadece bilet kanallarında çalışır.', ephemeral: true });
            }

            await interaction.reply({ content: '🔒 Bilet 5 saniye içinde kapatılacak...' });
            setTimeout(() => channel.delete().catch(() => {}), 5000);
        }
    }
});

// === BOT TOKEN İLE GİRİŞ ===
client.login(process.env.TOKEN);
