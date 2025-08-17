const { 
    Client, GatewayIntentBits, Partials,
    Collection,
    PermissionsBitField, ChannelType,
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    SlashCommandBuilder, Routes, StringSelectMenuBuilder
} = require('discord.js');
const { REST } = require('@discordjs/rest');
require('dotenv').config();

// ================== BOT OLUŞTUR ==================
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

// ================== KOMUTLAR ==================
const commands = [

    // ----- /ban -----
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı banlar.')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Banlanacak kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Ban sebebi')),

    // ----- /kick -----
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir kullanıcıyı sunucudan atar.')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Atma sebebi')),

    // ----- /banlist -----
    new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Banlı kullanıcıların listesini gösterir.'),

    // ----- /bilet -----
    new SlashCommandBuilder()
        .setName('bilet')
        .setDescription('Bilet menüsünü gönderir.')
]
.map(cmd => cmd.toJSON());

// ================== KOMUTLARI YÜKLE ==================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('⏳ Komutlar yükleniyor...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Komutlar başarıyla yüklendi.');
    } catch (err) {
        console.error(err);
    }
})();

// ================== BOT READY ==================
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} aktif!`);
});

// ================== INTERACTION ==================
const ticketLogChannelId = "LOG_KANAL_ID"; // 🎯 BURAYA log kanalının ID’sini yaz

client.on('interactionCreate', async (interaction) => {

    // ====== SLASH KOMUTLAR ======
    if (interaction.isChatInputCommand()) {

        // ----- /ban -----
        if (interaction.commandName === 'ban') {
            await interaction.deferReply({ ephemeral: true });

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.editReply('🚫 Ban yetkin yok.');
            }

            const user = interaction.options.getUser('kullanici');
            const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

            try {
                const member = await interaction.guild.members.fetch(user.id);
                if (!member.bannable) return interaction.editReply('🚫 Bu kullanıcıyı banlayamam.');
                await member.ban({ reason });
                await interaction.editReply(`✅ ${user.tag} banlandı. Sebep: ${reason}`);
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ Ban başarısız.');
            }
        }

        // ----- /kick -----
        if (interaction.commandName === 'kick') {
            await interaction.deferReply({ ephemeral: true });

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.editReply('🚫 Kick yetkin yok.');
            }

            const user = interaction.options.getUser('kullanici');
            const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

            try {
                const member = await interaction.guild.members.fetch(user.id);
                if (!member.kickable) return interaction.editReply('🚫 Bu kullanıcıyı atamam.');
                await member.kick(reason);
                await interaction.editReply(`✅ ${user.tag} atıldı. Sebep: ${reason}`);
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ Kick başarısız.');
            }
        }

        // ----- /banlist -----
        if (interaction.commandName === 'banlist') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const bans = await interaction.guild.bans.fetch();
                if (bans.size === 0) return interaction.editReply('🚫 Banlı kullanıcı yok.');
                const list = bans.map(b => `${b.user.tag} (${b.user.id})`).join('\n');
                await interaction.editReply(`📜 Banlı kullanıcılar:\n${list}`);
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ Ban listesi alınamadı.');
            }
        }

        // ----- /bilet -----
        if (interaction.commandName === 'bilet') {
            const embed = new EmbedBuilder()
                .setTitle('🎫 Destek Sistemi')
                .setDescription('Kategori seçerek bilet açabilirsiniz. ⚠️ Sadece **1 aktif bilet** açabilirsiniz.')
                .setColor('Blue');

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('Bir kategori seçin...')
                .addOptions([
                    { label: '🛠️ Destek', value: 'destek', description: 'Genel yardım' },
                    { label: '💸 Ödeme', value: 'odeme', description: 'Ödeme sorunları' },
                    { label: '🚨 Şikayet', value: 'sikayet', description: 'Kullanıcı şikayeti' },
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    // ====== BİLET SİSTEMİ ======
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
        const category = interaction.values[0];

        const existing = interaction.guild.channels.cache.find(
            c => c.type === ChannelType.GuildText && c.name === `ticket-${interaction.user.id}`
        );
        if (existing) return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${existing}`, ephemeral: true });

        const ch = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.id}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Kapat').setStyle(ButtonStyle.Danger)
        );

        await ch.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🎫 Destek Talebi')
                    .setDescription(`Kategori: **${category}**\n\nMerhaba ${interaction.user}, sorununu detaylı yaz.`)
                    .setColor('Blue')
                    .setFooter({ text: `Açan: ${interaction.user.tag}` })
                    .setTimestamp()
            ],
            components: [row]
        });

        await interaction.reply({ content: `✅ Biletiniz açıldı: ${ch}`, ephemeral: true });

        const logChannel = interaction.guild.channels.cache.get(ticketLogChannelId);
        if (logChannel) {
            logChannel.send(`📩 Yeni bilet açıldı: ${ch} | Açan: ${interaction.user.tag} | Kategori: **${category}**`);
        }
    }

    if (interaction.isButton() && interaction.customId === 'ticket_close') {
        if (!interaction.channel.name.startsWith('ticket-')) return;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_confirm_close').setLabel('✅ Evet, kapat').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_cancel_close').setLabel('❌ İptal').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Bu bileti kapatmak istediğinize emin misiniz?', components: [row], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'ticket_confirm_close') {
        await interaction.channel.delete().catch(() => {});
        const logChannel = interaction.guild.channels.cache.get(ticketLogChannelId);
        if (logChannel) {
            logChannel.send(`📪 Bilet kapatıldı.`);
        }
    }

    if (interaction.isButton() && interaction.customId === 'ticket_cancel_close') {
        await interaction.reply({ content: '❌ Kapatma iptal edildi.', ephemeral: true });
    }
});

// ================== BOTU BAŞLAT ==================
client.login(process.env.TOKEN);
