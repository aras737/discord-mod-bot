const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Roblox hesabınızı doğrulayın.")
    .addIntegerOption(option =>
      option.setName("robloxid")
        .setDescription("Roblox kullanıcı ID'nizi girin.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const robloxId = interaction.options.getInteger("robloxid");

    const filePath = path.join(__dirname, "../data/verified.json");
    let data = {};

    // Dosya varsa oku
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath);
      data = JSON.parse(fileContent);
    }

    // Doğrulama kaydını güncelle
    data[userId] = {
      robloxId,
      verified: true,
      verifiedAt: Date.now()
    };

    // Dosyaya yaz
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return interaction.reply({
      content: `✅ Roblox ID'niz başarıyla doğrulandı: **${robloxId}**`,
      ephemeral: true
    });
  }
};
