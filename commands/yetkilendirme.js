const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds 
    ] 
});

client.once('ready', () => {
    console.log(`Botunuz hazır! Giriş yapıldı: ${client.user.tag}`);

    // Komutu sunucuya kaydetme
    client.guilds.cache.forEach(guild => {
        guild.commands.create({
            name: 'yetki',
            description: 'Sunucudaki tüm rolleri ve yetkilerini listeler.',
        });
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'yetki') {
        // Komutu kullanan kişiye yanıtı özel olarak gönderiyoruz.
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const roles = guild.roles.cache.sort((a, b) => b.position - a.position);

        let replyMessage = "### Sunucudaki Tüm Roller ve Yetki Bilgileri\n\n";

        roles.forEach(role => {
            // @everyone rolünü atlıyoruz
            if (role.name === '@everyone') return;

            // Rolün yönetici yetkisi olup olmadığını kontrol ediyoruz.
            const isAdmin = role.permissions.has(PermissionsBitField.Flags.Administrator);
            const canKickMembers = role.permissions.has(PermissionsBitField.Flags.KickMembers);
            const canBanMembers = role.permissions.has(PermissionsBitField.Flags.BanMembers);
            const canManageChannels = role.permissions.has(PermissionsBitField.Flags.ManageChannels);
            
            replyMessage += `**Rol:** ${role.name}\n`;
            replyMessage += `**Yönetici Yetkisi:** ${isAdmin ? '✅ Evet' : '❌ Hayır'}\n`;
            replyMessage += `**Üyeleri Atma Yetkisi:** ${canKickMembers ? '✅ Evet' : '❌ Hayır'}\n`;
            replyMessage += `**Üyeleri Yasaklama Yetkisi:** ${canBanMembers ? '✅ Evet' : '❌ Hayır'}\n`;
            replyMessage += `**Kanalları Yönetme Yetkisi:** ${canManageChannels ? '✅ Evet' : '❌ Hayır'}\n`;
            replyMessage += "--------------------------------------\n";
        });

        if (replyMessage.length > 2000) {
            replyMessage = replyMessage.substring(0, 1997) + '...'; 
        }

        await interaction.editReply({ content: replyMessage });
    }
});

client.login(token);
