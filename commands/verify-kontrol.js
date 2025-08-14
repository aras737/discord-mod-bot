const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const fetch = require("node-fetch");

const GROUP_ID = process.env.GROUP_ID; // Roblox grup ID
const ROLE_ID = process.env.ROLE_ID;   // Discord rol ID

let codes = {};
if (fs.existsSync("./codes.json")) {
    codes = JSON.parse(fs.readFileSync("./codes.json", "utf8"));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verifykontrol")
        .setDescription("Kod ve grup kontrolü yapar")
        .addStringOption(option => 
            option.setName("username")
            .setDescription("Roblox kullanıcı adını gir")
            .setRequired(true)
        ),
    async execute(interaction) {
        const userId = interaction.user.id;
        const robloxUsername = interaction.options.getString("username");

        // Kod var mı ve süresi geçerli mi
        if (!codes[userId] || codes[userId].expiresAt < Date.now()) {
            return interaction.reply({ content: "Kodunuz yok veya süresi dolmuş! Tekrar /verify komutunu kullanın.", ephemeral: true });
        }
        const code = codes[userId].code;

        try {
            // Roblox ID al
            const resUser = await fetch(`https://api.roblox.com/users/get-by-username?username=${robloxUsername}`);
            const userData = await resUser.json();
            if (userData.errorMessage) return interaction.reply({ content: "Geçersiz kullanıcı adı!", ephemeral: true });
            const robloxId = userData.Id;

            // Açıklama al
            const resDesc = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
            const descData = await resDesc.json();
            const description = descData.description || "";

            // Kod kontrol
            if (!description.includes(code)) {
                return interaction.reply({ content: "Açıklamada kod bulunamadı! Lütfen kodu ekleyin ve tekrar deneyin.", ephemeral: true });
            }

            // Grup kontrol
            const resGroup = await fetch(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
            const groupData = await resGroup.json();
            const isInGroup = groupData.data.some(g => g.group.id.toString() === GROUP_ID);

            if (!isInGroup) return interaction.reply({ content: "Belirlenen grupta değilsiniz!", ephemeral: true });

            // Rol verme
            const role = interaction.guild.roles.cache.get(ROLE_ID);
            if (role) await interaction.member.roles.add(role);

            // Kod sil
            delete codes[userId];
            fs.writeFileSync("./codes.json", JSON.stringify(codes, null, 4));

            return interaction.reply({ content: "Doğrulama başarılı! ✅", ephemeral: true });

        } catch (err) {
            console.log(err);
            return interaction.reply({ content: "Doğrulama sırasında bir hata oluştu!", ephemeral: true });
        }
    }
};
