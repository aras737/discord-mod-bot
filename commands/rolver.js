// index.js veya bot.js
const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Slash komut tanımı
const salahCommand = new SlashCommandBuilder()
    .setName('salah')
    .setDescription('Sunucudaki tüm rolleri siler (TEHLİKELİ!)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

client.once('ready', async () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    
    // Komutları kaydet
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Slash komutları kaydediliyor...');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [salahCommand.toJSON()] }
        );
        
        console.log('Slash komutları başarıyla kaydedildi!');
    } catch (error) {
        console.error('Komut kaydı hatası:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'salah') {
        // Yetki kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısın!',
                ephemeral: true
            });
        }
        
        // Bot yetkisi kontrolü
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: '❌ Rolleri silmek için gerekli yetkilere sahip değilim!',
                ephemeral: true
            });
        }
        
        await interaction.deferReply();
        
        try {
            const roles = interaction.guild.roles.cache.filter(role => 
                role.id !== interaction.guild.id && // @everyone rolünü atla
                role.position < interaction.guild.members.me.roles.highest.position // Botun rolünden düşük rolleri al
            );
            
            let deletedCount = 0;
            let errorCount = 0;
            
            for (const [id, role] of roles) {
                try {
                    await role.delete('Salah komutu ile silindi');
                    deletedCount++;
                    console.log(`Silindi: ${role.name}`);
                    
                    // Rate limit'e takılmamak için bekleme
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    errorCount++;
                    console.error(`Silinemedi ${role.name}:`, error.message);
                }
            }
            
            await interaction.editReply({
                content: `✅ İşlem tamamlandı!\n📊 Silinen rol sayısı: **${deletedCount}**\n❌ Silinemyen rol sayısı: **${errorCount}**`
            });
            
        } catch (error) {
            console.error('Hata:', error);
            await interaction.editReply({
                content: '❌ Roller silinirken bir hata oluştu!'
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
