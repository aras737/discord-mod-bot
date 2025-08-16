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

// === BOT TOKEN İLE GİRİŞ ===
client.login(process.env.TOKEN);
