const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

// Ayarlar
const GROUP_ID = "33389098"; // Roblox grup ID
const VERIFIED_ROLE_ID = "1399254986348560526"; // Discord verified rol ID
const LOG_CHANNEL_ID = "1403286303335776347"; // İsteğe bağlı log kanalı ID
const DATA_FILE = './verified.json';

// JSON dosyası yoksa oluştur
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Roblox hesabınızı doğrulayın'),

    async execute(interaction) {
        const userId = interaction.user.id;
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        if (data[userId]) {
            return interaction.reply({ content: "✅ Zaten doğrulandınız!", ephemeral: true });
        }

        // Tek seferlik kod oluştur
        const code = Math.random().toString(36).substring(2, 10);
        await interaction.reply({ 
            content: `🔑 Doğrulama kodunuz: **${code}**\nRoblox profilinizin "about" kısmına ekleyin ve **/verify** komutunu tekrar çalıştırın.`,
            ephemeral: true 
        });

        // 2 dakika içinde kontrol
        setTimeout(async () => {
            try {
                // Roblox kullanıcı adını al
                const resUser = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    data: { usernames: [interaction.member.displayName] }
                });

                if (!resUser.data.data.length) return;

                const robloxId = resUser.data.data[0].id;

                // Profil açıklamasını kontrol et
                const resDesc = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
                if (!resDesc.data.description.includes(code)) return;

                // Grup rolünü al
                const resGroup = await axios.get(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
                const groupRole = resGroup.data.data.find(g => g.group.id == GROUP_ID);
                if (!groupRole) return;

                // Discord rol eşleştirmesi
                const discordRole = interaction.guild.roles.cache.find(r => r.name === groupRole.role.name);
                if (discordRole) await interaction.member.roles.add(discordRole);

                // Verified rolünü ekle
                await interaction.member.roles.add(VERIFIED_ROLE_ID);

                // Kaydet
                data[userId] = { robloxId, verifiedAt: Date.now() };
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

                // Log kanalı
                if (LOG_CHANNEL_ID) {
                    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                    if (logChannel) {
                        logChannel.send(`✅ ${interaction.user.tag} Roblox doğrulamasını tamamladı. Rol: **${groupRole.role.name}**`);
                    }
                }

                await interaction.followUp({ content: "✅ Doğrulama başarılı!", ephemeral: true });

            } catch (err) {
                console.error(err);
            }
        }, 120000); // 2 dakika
    }
};
