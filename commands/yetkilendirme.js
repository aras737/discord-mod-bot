const { SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require("discord.js");

// Railway environment değişkenleri
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki")
    .setDescription("Bottaki tüm komutlara otomatik yetki uygular")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // sadece admin kullanabilir

  async execute(interaction, client) {
    try {
      await interaction.reply("⏳ Komutlar ve roller için otomatik yetki ayarlanıyor...");

      // 1️⃣ Bottaki tüm slash komutlarını al
      const commands = await client.application.commands.fetch({ guildId: GUILD_ID });

      // 2️⃣ Her komutu tek tek işle
      const updatedCommands = [];
      commands.forEach(cmd => {
        // Eğer komutun default permission'ı yoksa veya güncellemek istiyorsak
        const newPermissions = cmd.default_member_permissions ?? 0n; // 0 = herkes
        updatedCommands.push({
          id: cmd.id,
          name: cmd.name,
          description: cmd.description,
          default_member_permissions: newPermissions
        });
      });

      // 3️⃣ REST API ile güncelle
      const rest = new REST({ version: "10" }).setToken(TOKEN);
      for (const cmd of updatedCommands) {
        await rest.patch(
          Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, cmd.id),
          { body: { default_member_permissions: cmd.default_member_permissions } }
        );
      }

      await interaction.editReply("✅ Tüm slash komutlar için otoyetki başarıyla uygulandı!");

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Otoyetki uygulanırken bir hata oluştu!");
    }
  }
};
