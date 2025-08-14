const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const fetch = require("node-fetch");

let verifiedData = {};
if (fs.existsSync("./verified.json")) {
    verifiedData = JSON.parse(fs.readFileSync("./verified.json", "utf8"));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Roblox doğrulama sistemi")
        .addStringOption(option => 
            option.setName("username")
            .setDescription("Roblox kullanıcı adını gir")
            .setRequired(true)
        ),
    async execute(interaction) {
        const robloxUsername = interaction.options.getString("username");
        const userId = interaction.user.id;

        // Kod var mı ve süresi dolmamış mı kontrol et
        const existing = verifiedData[userId];
        if (existing && existing.expiresAt > Date.now()) {
            return interaction.reply({ content: `Kodun hâlâ geçerli! Roblox açıklamana ekle: **${existing.code}**\nSüre dolmadan tekrar kontrol edebilirsin.`, ephemeral: true });
        }

        // Yeni kod oluştur
        const code = Math.floor(1000 + Math.random() * 9000); // 4 haneli
        verifiedData[userId] = {
            username: robloxUsername,
            code: code,
            expiresAt: Date.now() + 2 * 60 * 1000 // 2 dakika
        };
        fs.writeFileSync("./verified.json", JSON.stringify(verifiedData, null, 4));

        // Kod kontrolü
        try {
            const resUser = await fetch(`https://api.roblox.com/users/get-by-username?username=${robloxUsername}`);
            const userData = await resUser.json();

            if (userData.errorMessage) {
                return interaction.reply({ content: "Geçersiz Roblox kullanıcı adı!", ephemeral: true });
            }

            const userIdRoblox = userData.Id;
            const resDesc = await fetch(`https://users.roblox.com/v1/users/${userIdRoblox}`);
            const descData = await resDesc.json();
            const description = descData.description || "";

            if (description.includes(code.toString())) {
                // Doğrulandı
                const role = interaction.guild.roles.cache.find(r => r.name === "Verified");
                if (role) await interaction.member.roles.add(role);

                delete verifiedData[userId];
                fs.writeFileSync("./verified.json", JSON.stringify(verifiedData, null, 4));

                return interaction.reply({ content: "Başarıyla doğrulandın! ✅" });
            } else {
                return interaction.reply({ content: `Doğrulama kodun: **${code}**\nAçıklamana ekledikten sonra tekrar /verify ${robloxUsername} yaz.` });
            }

        } catch (err) {
            console.log(err);
            return interaction.reply({ content: "Doğrulama sırasında bir hata oluştu!", ephemeral: true });
        }
    }
};
