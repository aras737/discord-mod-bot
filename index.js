const { 
    Client, 
    Collection, 
    GatewayIntentBits, 
    Partials, 
    Events, 
    REST, 
    Routes, 
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const express = require('express');
require('dotenv').config();

// BOT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();
const commandsArray = [];

// 📂 Komutları yükle
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());
            console.log(`✅ Komut yüklendi: ${command.data.name}`);
        } else {
            console.log(`⚠️ Atlandı (data veya execute eksik): ${file}`);
        }
    } catch (error) {
        console.error(`❌ Komut yüklenirken hata: ${file}\n`, error);
    }
}

// 🌐 Express Sunucu
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('🤖 Bot aktif!');
});

app.listen(PORT, () => {
    console.log(`🌐 Express portu dinleniyor: ${PORT}`);
    console.log(`📌 Panel: http://localhost:${PORT}/`);
});

// 🤖 Bot aktif olduğunda
client.once(Events.ClientReady, async readyClient => {
    console.log(`\n🤖 Bot aktif: ${readyClient.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(readyClient.user.id),
            { body: commandsArray }
        );
        console.log('✅ Slash komutlar yüklendi.');
    } catch (error) {
        console.error('❌ Slash komutlar yüklenemedi:', error);
    }
});

// 🎯 Slash Komutlar
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Komut çalıştırılırken hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Komut çalıştırılırken hata oluştu!', ephemeral: true });
            }
        }
    }

    // 🎟️ Bilet Sistemi
    if (interaction.isButton()) {
        if (interaction.customId === "ticket_create") {
            const existingChannel = interaction.guild.channels.cache.find(
                c => c.name === `ticket-${interaction.user.id}`
            );
            if (existingChannel) {
                return interaction.reply({ content: "❌ Zaten açık bir biletiniz var.", ephemeral: true });
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.id}`,
                type: ChannelType.GuildText,
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
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    }
                ]
            });

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("🔒 Kapat")
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎟️ Destek Talebi")
                        .setDescription(`Merhaba ${interaction.user}, destek ekibi seninle ilgilenecektir.`)
                        .setColor(0x00AE86)
                ],
                components: [closeButton]
            });

            await interaction.reply({ content: `✅ Biletiniz açıldı: ${ticketChannel}`, ephemeral: true });
        }

        if (interaction.customId === "ticket_close") {
            await interaction.channel.delete();
        }
    }
});

// 🔑 Botu başlat
client.login(process.env.TOKEN);
