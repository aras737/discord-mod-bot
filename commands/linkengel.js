const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- VERİTABANI/AYARLAR YÖNETİMİ ---
// DİKKAT: Bu yollar, komut dosyasının /commands/ içinde ve config dosyalarının botun ana dizininde olduğunu varsayar.
const LINK_CONFIG_PATH = path.resolve(__dirname, '../../link_config.json');
const LOG_CONFIG_PATH = path.resolve(__dirname, '../../log_config.json'); 

// Regex: Tüm yaygın link formatlarını (http, https, www, discord.gg vb.) yakalar.
const linkRegex = /(?:https?:\/\/[^\s]+|www\.[^\s]+|discord\.(?:gg|io|me|li)|(?:[a-z0-9]+-?){1,3}\.[a-z]{2,})/gi;

// Sunucu ayarlarını çeker (Link Ayarları)
function getLinkSettings(guildId) {
    if (!fs.existsSync(LINK_CONFIG_PATH)) return { enabled: false, ignoredChannels: [] };
    
    try {
        const config = JSON.parse(fs.readFileSync(LINK_CONFIG_PATH, 'utf8'));
        const settings = config[guildId];
        
        if (!settings || typeof settings.enabled !== 'boolean') {
            return { enabled: false, ignoredChannels: [] };
        }
        return settings;
    } catch (e) {
        console.error("Link ayarları JSON okuma hatası:", e);
        return { enabled: false, ignoredChannels: [] };
    }
}

// Ayarları kaydeder (Link Ayarları)
function saveLinkSettings(guildId, settings) {
    let config = {};
    if (fs.existsSync(LINK_CONFIG_PATH)) {
        try {
            config = JSON.parse(fs.readFileSync(LINK_CONFIG_PATH, 'utf8'));
        } catch (e) {
            console.error("Link ayarları JSON yazma/okuma hatası:", e);
            // Hata durumunda mevcut ayarları kaybetmemek için devam et.
        }
    }
    config[guildId] = settings;
    fs.writeFileSync(LINK_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

// Log kanal ID'sini çeker (Loglama sisteminden entegre edilmiştir)
function getLogChannelId(guildId) {
    if (!fs.existsSync(LOG_CONFIG_PATH)) return null;
    
    try {
        const config = JSON.parse(fs.readFileSync(LOG_CONFIG_PATH, 'utf8'));
        // Log sisteminizde kanal ID'si doğrudan kaydedilmişse
        return config[guildId] || null; 
    } catch (e) {
        console.error("Log ayarları JSON okuma hatası:", e);
        return null;
    }
}

// Yardımcı fonksiyon: Log Embed'i gönderir
async function sendLog(guild, embed) {
    if (!guild) return;
    
    const logChannelId = getLogChannelId(guild.id);
    if (!logChannelId) return; 

    try {
        // Kanala erişim yetkisi olmalı
        const logChannel = await guild.channels.fetch(logChannelId);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        // Eğer bot kanalı bulamazsa veya yetkisi yoksa
        console.error(`Log kanalına (${logChannelId}) mesaj gönderilemedi:`, error.message);
    }
}


// --- 2. SLASH KOMUT TANIMI VE İŞLEMLERİ ---
module.exports = {
    data: new SlashCommandBuilder()
        .setName('linkengel')
        .setDescription('Link engelleme sistemini yönetir (Aç/Kapat/Hariç tutulan kanal ekle).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Sadece Yönetici
        .addSubcommand(subcommand =>
            subcommand.setName('durum')
                .setDescription('Link engellemeyi açar veya kapatır.')
                .addBooleanOption(option =>
                    option.setName('aktif')
                        .setDescription('Açmak için "true", kapatmak için "false" seçin.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('kanalekle')
                .setDescription('Link engelleyicinin çalışmayacağı kanalı ekler.')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Hariç tutulacak metin kanalını seçin.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(subcommand =>
            subcommand.setName('kanalkaldir')
                .setDescription('Hariç tutulan kanalı listeden kaldırır.')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Kaldırılacak metin kanalını seçin.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText))),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();
        let settings = getLinkSettings(guildId);
        
        if (subcommand === 'durum') {
            const isActive = interaction.options.getBoolean('aktif');
            settings.enabled = isActive;
            saveLinkSettings(guildId, settings);

            const statusText = isActive ? '✅ **AÇIK**' : '❌ **KAPALI**';
            return interaction.reply({ 
                content: `Link engelleme sistemi başarıyla ${statusText} duruma getirildi.`, 
                ephemeral: true 
            });
        }
        
        if (subcommand === 'kanalekle') {
            const channel = interaction.options.getChannel('kanal');
            if (settings.ignoredChannels.includes(channel.id)) {
                return interaction.reply({ content: `❌ ${channel} zaten hariç tutulan kanallar listesinde.`, ephemeral: true });
            }

            settings.ignoredChannels.push(channel.id);
            saveLinkSettings(guildId, settings);
            return interaction.reply({ content: `✅ ${channel} kanalı link engellemeyi uygulamayacak şekilde eklendi.`, ephemeral: true });
        }
        
        if (subcommand === 'kanalkaldir') {
            const channel = interaction.options.getChannel('kanal');
            const index = settings.ignoredChannels.indexOf(channel.id);

            if (index === -1) {
                return interaction.reply({ content: `❌ ${channel} kanalı zaten listede yok.`, ephemeral: true });
            }

            settings.ignoredChannels.splice(index, 1);
            saveLinkSettings(guildId, settings);
            return interaction.reply({ content: `✅ ${channel} kanalı hariç tutulan kanallar listesinden kaldırıldı.`, ephemeral: true });
        }
    },

    // --- 3. EVENT DİNLEYİCİ FONKSİYONU ---
    registerEvents(client) {
        client.on(Events.MessageCreate, async message => {
            // 1. Temel Kontroller
            if (!message.guild || message.author.bot) return;
            
            // 2. Ayarları Çek ve Durum Kontrolü
            const settings = getLinkSettings(message.guild.id);
            if (!settings || settings.enabled === false) return;
            
            // 3. Hariç Tutulan Kanal Kontrolü
            if (settings.ignoredChannels.includes(message.channel.id)) return;
            
            // 4. Yetki Kontrolü: Yöneticiler link atabilir
            const isAdministrator = message.member.permissions.has(PermissionFlagsBits.Administrator);
            if (isAdministrator) return; 

            // 5. Link Kontrolü
            const hasLink = linkRegex.test(message.content);

            if (hasLink) {
                try {
                    const deletedContent = message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '');
                    
                    // Mesajı sil
                    await message.delete();
                    
                    // Kullanıcıya uyarı mesajı (5 sn sonra silinir)
                    const warningMessage = await message.channel.send({ 
                        content: `${message.author}, bu sunucuda link paylaşımı **yöneticiler hariç** yasaktır!`, 
                    });
                    setTimeout(() => warningMessage.delete().catch(() => {}), 5000);

                    // --- LOG KAYDI ---
                    const logEmbed = new EmbedBuilder()
                        .setColor('#ff4500')
                        .setTitle('🔗 Link Engellendi')
                        .addFields(
                            { name: 'Kullanıcı', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                            { name: 'Kanal', value: `${message.channel}`, inline: true },
                            { name: 'Engellenen Mesaj (İlk 100 Karakter)', value: `\`\`\`\n${deletedContent}\n\`\`\``, inline: false }
                        )
                        .setTimestamp();

                    sendLog(message.guild, logEmbed);

                } catch (error) {
                    console.error(`[Link Engelleyici] Mesaj silme yetkisi yok veya başka bir hata:`, error.message);
                }
            }
        });
    }
};
