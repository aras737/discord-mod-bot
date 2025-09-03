const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds 
    ] 
});

// Bot hazır olduğunda çalışacak kısım
client.once('ready', () => {
    console.log(`Botunuz hazır! Giriş yapıldı: ${client.user.tag}`);
    
    // Slash komutlarını kaydetme (bot her açıldığında kontrol eder)
    const commands = [
        {
            name: 'yetki',
            description: 'Sunucudaki tüm rolleri ve yetkilerini listeler.',
        },
        {
            name: 'ping',
            description: 'Botun gecikme süresini gösterir.',
        },
    ];
    
    // Global veya sunucuya özel komutları kaydedebilirsiniz.
    // Şimdilik sadece "yetki" komutunu kaydedelim, diğerleri sizin eklemeniz için.
    
    // Sadece /yetki komutunu kaydeden örnek
    const rest = new (require('@discordjs/rest').REST)({ version: '10' }).setToken(token);
    (async () => {
        try {
            console.log('(/) Komutlar yenileniyor...');
            await rest.put(
                require('discord-api-types/v9').Routes.applicationCommands(client.user.id),
                { body: commands },
            );
            console.log('(/) Komutlar başarıyla yüklendi.');
        } catch (error) {
            console.error(error);
        }
    })();
});

// Kullanıcı bir komut kullandığında çalışacak kısım
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const member = interaction.member;

    // --- Yetki Kontrol Alanı Başlangıcı ---
    
    // 'yetki' komutunu sadece Yönetici yetkisi olanlar kullanabilsin.
    if (commandName === 'yetki') {
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: "Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız!", 
                ephemeral: true 
            });
        }
    }

    // 'ping' komutunu sadece belirli bir rolü olanlar kullanabilsin.
    // Örnek: 'Bot Komutları' adında bir rolünüz varsa, bu rolü kontrol edebilirsiniz.
    // Bu kontrol için rol ID'sini veya adını kullanabilirsiniz.
    if (commandName === 'ping') {
        const requiredRoleName = 'Bot Komutları'; // Rol adını buraya girin
        const hasRequiredRole = member.roles.cache.some(role => role.name === requiredRoleName);

        if (!hasRequiredRole) {
            return interaction.reply({
                content: `Bu komutu kullanmak için **${requiredRoleName}** rolüne sahip olmalısınız!`,
                ephemeral: true
            });
        }
    }
    
    // --- Yetki Kontrol Alanı Sonu ---


    // --- Komut İşleme Alanı ---

    if (commandName === 'yetki') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const roles = guild.roles.cache.sort((a, b) => b.position - a.position);

        let replyMessage = "### Sunucudaki Tüm Roller ve Yetki Bilgileri\n\n";

        roles.forEach(role => {
            if (role.name === '@everyone') return;

            const isAdmin = role.permissions.has(PermissionsBitField.Flags.Administrator);
            const canKickMembers = role.permissions.has(PermissionsBitField.Flags.KickMembers);
            const canBanMembers = role.permissions.has(PermissionsBitField.Flags.BanMembers);
            
            replyMessage += `**Rol:** ${role.name}\n`;
            replyMessage += `**Yönetici Yetkisi:** ${isAdmin ? '✅ Evet' : '❌ Hayır'}\n`;
            replyMessage += `**Üyeleri Atma Yetkisi:** ${canKickMembers ? '✅ Evet' : '❌ Hayır'}\n`;
            replyMessage += `**Üyeleri Yasaklama Yetkisi:** ${canBanMembers ? '✅ Evet' : '❌ Hayır'}\n`;
            replyMessage += "--------------------------------------\n";
        });

        if (replyMessage.length > 2000) {
            replyMessage = replyMessage.substring(0, 1997) + '...'; 
        }

        await interaction.editReply({ content: replyMessage });
    }
    
    if (commandName === 'ping') {
        await interaction.reply({ content: `Pong! Gecikme süresi: **${client.ws.ping}ms**` });
    }
});

client.login(token);
