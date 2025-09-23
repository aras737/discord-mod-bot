const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Slash command tanımı
const commands = [
    new SlashCommandBuilder()
        .setName('roblox')
        .setDescription('Roblox kullanıcı bilgilerini ve gruplarını sorgula')
        .addStringOption(option =>
            option.setName('kullanici')
                .setDescription('Roblox kullanıcı adı')
                .setRequired(true)
        )
];

// Roblox API fonksiyonları
async function getRobloxUserByUsername(username) {
    try {
        const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
            usernames: [username]
        });
        
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0];
        }
        return null;
    } catch (error) {
        console.error('Kullanıcı arama hatası:', error);
        return null;
    }
}

async function getRobloxUserDetails(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Kullanıcı detay hatası:', error);
        return null;
    }
}

async function getRobloxUserAvatar(userId) {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0].imageUrl;
        }
        return null;
    } catch (error) {
        console.error('Avatar alma hatası:', error);
        return null;
    }
}

async function getRobloxUserGroups(userId) {
    try {
        const response = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
        return response.data.data || [];
    } catch (error) {
        console.error('Grup bilgileri alma hatası:', error);
        return [];
    }
}

async function getRobloxUserFriends(userId) {
    try {
        const response = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
        return response.data.count;
    } catch (error) {
        console.error('Arkadaş sayısı hatası:', error);
        return 'Bilinmiyor';
    }
}

async function getRobloxUserFollowers(userId) {
    try {
        const response = await axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`);
        return response.data.count;
    } catch (error) {
        console.error('Takipçi sayısı hatası:', error);
        return 'Bilinmiyor';
    }
}

async function getRobloxUserFollowing(userId) {
    try {
        const response = await axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`);
        return response.data.count;
    } catch (error) {
        console.error('Takip edilen sayısı hatası:', error);
        return 'Bilinmiyor';
    }
}

// Bot hazır olduğunda
client.once('ready', async () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    
    // Slash commandları kaydet
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Slash commandlar kaydediliyor...');
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log('Slash commandlar başarıyla kaydedildi!');
    } catch (error) {
        console.error('Slash command kayıt hatası:', error);
    }
});

// Slash command etkileşimleri
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'roblox') {
        await interaction.deferReply();

        const username = interaction.options.getString('kullanici');

        try {
            // Kullanıcıyı bul
            const user = await getRobloxUserByUsername(username);
            
            if (!user) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Hata')
                    .setDescription(`**${username}** adında bir kullanıcı bulunamadı.`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            // Kullanıcı detaylarını al
            const [userDetails, avatar, groups, friendsCount, followersCount, followingCount] = await Promise.all([
                getRobloxUserDetails(user.id),
                getRobloxUserAvatar(user.id),
                getRobloxUserGroups(user.id),
                getRobloxUserFriends(user.id),
                getRobloxUserFollowers(user.id),
                getRobloxUserFollowing(user.id)
            ]);

            if (!userDetails) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Hata')
                    .setDescription('Kullanıcı bilgileri alınamadı.')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            // Tarih formatla
            const createdDate = new Date(userDetails.created);
            const formattedDate = createdDate.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Ana embed oluştur
            const embed = new EmbedBuilder()
                .setColor('#00b2ff')
                .setTitle(`${userDetails.displayName || userDetails.name}`)
                .setURL(`https://www.roblox.com/users/${user.id}/profile`)
                .addFields(
                    { name: 'Kullanıcı Adı', value: `@${userDetails.name}`, inline: true },
                    { name: 'Kullanıcı ID', value: user.id.toString(), inline: true },
                    { name: 'Katılım Tarihi', value: formattedDate, inline: true },
                    { name: 'Arkadaş Sayısı', value: friendsCount.toString(), inline: true },
                    { name: 'Takipçi Sayısı', value: followersCount.toString(), inline: true },
                    { name: 'Takip Edilen', value: followingCount.toString(), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Roblox Kullanıcı Sorgu', iconURL: client.user.displayAvatarURL() });

            // Avatar varsa ekle
            if (avatar) {
                embed.setThumbnail(avatar);
            }

            // Açıklama varsa ekle
            if (userDetails.description && userDetails.description.trim()) {
                embed.addFields({ name: 'Açıklama', value: userDetails.description.substring(0, 1024), inline: false });
            }

            // Grupları işle
            if (groups && groups.length > 0) {
                // Grupları katılım tarihine göre sırala (en eski önce)
                const sortedGroups = groups.sort((a, b) => {
                    const dateA = new Date(a.created || '1970-01-01');
                    const dateB = new Date(b.created || '1970-01-01');
                    return dateA - dateB;
                });

                let groupText = '';
                let groupCount = 0;
                const maxGroups = 10; // Maksimum gösterilecek grup sayısı

                for (const groupData of sortedGroups) {
                    if (groupCount >= maxGroups) break;
                    
                    const group = groupData.group;
                    const role = groupData.role;
                    
                    if (group && role) {
                        // Katılım tarihini formatla
                        let joinDate = 'Bilinmiyor';
                        if (groupData.created) {
                            const date = new Date(groupData.created);
                            joinDate = date.toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                        }

                        groupText += `**${group.name}**\n`;
                        groupText += `Rütbe: ${role.name}\n`;
                        groupText += `Katılım: ${joinDate}\n`;
                        groupText += `Grup ID: ${group.id}\n\n`;
                        
                        groupCount++;
                    }
                }

                if (groupText) {
                    // Grup bilgilerini ayrı embed'de göster
                    const groupEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle(`Gruplar (${groups.length} grup)`)
                        .setDescription(groupText.substring(0, 4096))
                        .setTimestamp();

                    if (groups.length > maxGroups) {
                        groupEmbed.setFooter({ 
                            text: `İlk ${maxGroups} grup gösteriliyor. Toplam ${groups.length} grup.`,
                            iconURL: client.user.displayAvatarURL() 
                        });
                    }

                    return await interaction.editReply({ embeds: [embed, groupEmbed] });
                } else {
                    embed.addFields({ name: 'Gruplar', value: 'Herhangi bir gruba üye değil.', inline: false });
                }
            } else {
                embed.addFields({ name: 'Gruplar', value: 'Herhangi bir gruba üye değil.', inline: false });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Roblox sorgu hatası:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Hata')
                .setDescription('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});

// Hata yakalama
client.on('error', console.error);

process.on('unhandledRejection', error => {
    console.error('Yakalanmamış Promise hatası:', error);
});

// Botu başlat
client.login(process.env.DISCORD_TOKEN);
