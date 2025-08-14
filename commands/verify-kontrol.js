const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const fetch = require("node-fetch");

const GROUP_ID = process.env.GROUP_ID; // Roblox grup ID

let codes = {};
if (fs.existsSync("./codes.json")) {
    codes = JSON.parse(fs.readFileSync("./codes.json", "utf8"));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verifykontrol")
        .setDescription("Kod ve grup rol kontrolü yapar")
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
            return interaction.reply({ content: "Kodunuz yok veya süresi dolmuş! Tekrar /verify kullanın.", ephemeral: true });
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
                return interaction.reply({ content: "Açıklamada kod bulunamadı! Kod bozuk veya eklenmemiş.", ephemeral: true });
            }

            // Grup kontrol ve rol eşleme
            const resGroup = await fetch(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
            const groupData = await resGroup.json();
            const groupInfo = groupData.data.find(g => g.group.id.toString() === GROUP_ID);
            if (!groupInfo) return interaction.reply({ content: "Belirlenen grupta değilsiniz!", ephemeral: true });

            // Roblox rol ismini al
            const robloxRoleName = groupInfo.role.name;

            // Discord'da aynı isimli rol var mı kontrol et
            const role = interaction.guild.roles.cache.find(r => r.name === robloxRoleName);
            if (role) await interaction.member.roles.add(role);

            // Kod sil
            delete codes[userId];
            fs.writeFileSync("./codes.json", JSON.stringify(codes, null, 4));

            return interaction.reply({ content: `Doğrulama başarılı! Roblox rolünüz Discord ile eşitlendi: **${robloxRoleName}** ✅`, ephemeral: true });

        } catch (err) {
            console.log(err);
            return interaction.reply({ content: "Doğrulama sırasında bir hata oluştu!", ephemeral: true });
        }
    }
};
