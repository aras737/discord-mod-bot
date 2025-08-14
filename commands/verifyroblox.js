const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Roblox hesabınızı doğrular.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const verifyData = JSON.parse(fs.readFileSync('./verified.json', 'utf8'));

        // Daha önce doğrulanmış mı?
        if (verifyData[userId]) {
            return interaction.reply({ content: '✅ Zaten doğrulanmışsınız!', ephemeral: true });
        }

        // Benzersiz doğrulama kodu
        const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        verifyData[userId] = { code: uniqueCode, verified: false };
        fs.writeFileSync('./verified.json', JSON.stringify(verifyData, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('🔑 Roblox Doğrulama')
            .setDescription(`Roblox profil açıklamanıza aşağıdaki kodu ekleyin ve ardından **Doğrula** butonuna tıklayın.\n\n**Kod:** \`${uniqueCode}\``)
            .setColor(0x00AE86);

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify-check')
                .setLabel('✅ Doğrula')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });
    },

    async button(interaction) {
        if (interaction.customId !== 'verify-check') return;

        const userId = interaction.user.id;
        const verifyData = JSON.parse(fs.readFileSync('./verified.json', 'utf8'));

        if (!verifyData[userId]) {
            return interaction.reply({ content: '⚠ Önce /verify komutunu çalıştırmalısınız.', ephemeral: true });
        }

        const code = verifyData[userId].code;

        try {
            // Roblox kullanıcı adını burada manuel alıyoruz
            const username = 'KULLANICI_ADI'; // Bunu kullanıcıdan alacak şekilde düzenleyebilirsin
            const userRes = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);

            if (!userRes.data || !userRes.data.Id) {
                return interaction.reply({ content: '❌ Roblox kullanıcı bulunamadı.', ephemeral: true });
            }

            const aboutRes = await axios.get(`https://users.roblox.com/v1/users/${userRes.data.Id}`);

            // Hata önleme: açıklama gerçekten string mi kontrol et
            if (typeof aboutRes.data.description === 'string' && aboutRes.data.description.includes(code)) {
                verifyData[userId].verified = true;
                fs.writeFileSync('./verified.json', JSON.stringify(verifyData, null, 2));

                return interaction.reply({ content: '✅ Roblox hesabınız başarıyla doğrulandı!', ephemeral: true });
            } else {
                return interaction.reply({ content: '❌ Profil açıklamanızda doğrulama kodu bulunamadı.', ephemeral: true });
            }
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ Doğrulama sırasında bir hata oluştu.', ephemeral: true });
        }
    }
};
