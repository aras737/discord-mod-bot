const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- VERİTABANI/AYARLAR YÖNETİMİ ---
// Ayarların saklandığı dosya yolu. Projenizin ana dizinine göre ayarlayın.
// Varsayım: Bu dosya /commands/ içinde, config ise ana dizinde.
const configPath = path.resolve(__dirname, '../../link_config.json');

// Yardımcı Fonksiyon: Sunucu ayarlarını çeker
function getLinkSettings(guildId) {
    if (!fs.existsSync(configPath)) return { enabled: false, ignoredChannels: [] };
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const settings = config[guildId];
    
    if (!settings || typeof settings.enabled !== 'boolean') {
        return { enabled: false, ignoredChannels: [] };
    }
    return settings;
}

// Yardımcı Fonksiyon: Ayarları kaydeder
function saveLinkSettings(guildId, settings) {
    let config = {};
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    config[guildId] = settings;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

// Link Regex (HTTP/HTTPS linklerini ve discord.gg davetlerini yakalar)
const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+)/gi;


// --- 1. SLASH KOMUT TANIMI ---
module.exports = {
    // Komut verileri (Sadece yöneticiler kullanabilir)
    data: new SlashCommandBuilder()
        .setName('linkengel')
        .setDescription('Link engelleme sistemini yönetir (Aç/Kapat/Hariç tutulan kanal ekle).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
    
    // Komut çalıştığında
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();
        let settings = getLinkSettings(guildId); // Mevcut ayarları çek
        
        // --- DURUM ALT KOMUTU ---
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
        
        // --- KANAL EKLE ALT KOMUTU ---
        if (subcommand === 'kanalekle') {
            const channel = interaction.options.getChannel('kanal');
            if (settings.ignoredChannels.includes(channel.id)) {
                return interaction.reply({ content: `❌ ${channel} zaten hariç tutulan kanallar listesinde.`, ephemeral: true });
            }

            settings.ignoredChannels.push(channel.id);
            saveLinkSettings(guildId, settings);
            return interaction.reply({ content: `✅ ${channel} kanalı link engellemeyi uygulamayacak şekilde eklendi.`, ephemeral: true });
        }
        
        // --- KANAL KALDIR ALT KOMUTU ---
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

    // --- 2. EVENT DİNLEYİCİ (KOMUTUN DIŞINDA TANIMLANIR) ---
    // Bu fonksiyon, botun ana dosyasındaki komut yükleyicisi tarafından çağrılacaktır.
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
                    // Mesajı sil
                    await message.delete();
                    
                    // Kullanıcıya geçici bir uyarı gönder
                    const warningMessage = await message.channel.send({ 
                        content: `${message.author}, bu sunucuda link paylaşımı **yöneticiler hariç** yasaktır!`, 
                    });
                    
                    // Uyarı mesajını 5 saniye sonra sil
                    setTimeout(() => warningMessage.delete().catch(() => {}), 5000);

                } catch (error) {
                    // Botun silme yetkisi yoksa burada bir hata mesajı görünebilir.
                    console.error(`Linkli mesaj silinemedi:`, error);
                }
            }
        });
    }
};
