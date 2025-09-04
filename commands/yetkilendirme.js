const { SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki")
    .setDescription("Bottaki tüm slash komutlara otomatik yetki uygular")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // sadece admin kullanabilir
  async execute(interaction, client) {
    try {
      await interaction.reply("⏳ Komutlar ve roller için otomatik yetki ayarlanıyor...");

      const guild = await client.guilds.fetch(interaction.guildId);
      const roles = await guild.roles.fetch();
      const commands = await client.application.commands.fetch({ guildId: interaction.guildId });
      const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

      // Tüm komutları kontrol et
      for (const [id, cmd] of commands) {

        // Komutun gerekli izinleri
        const requiredPerm = BigInt(cmd.default_member_permissions ?? 0n);

        // İzinli roller
        const allowedRoles = [];
        roles.forEach(role => {
          if ((BigInt(role.permissions.bitfield) & requiredPerm) === requiredPerm) {
            allowedRoles.push(role.id);
          }
        });

        // Hiç rol izinli değilse komutu tamamen gizle
        const newPerm = allowedRoles.length > 0 ? requiredPerm : 0n;

        // Komutu güncelle
        await rest.patch(
          Routes.applicationGuildCommand(client.user.id, interaction.guildId, id),
          { body: { default_member_permissions: newPerm } }
        );
      }

      await interaction.editReply("✅ Tüm slash komutlar için otoyetki başarıyla uygulandı!");

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Otoyetki uygulanırken bir hata oluştu!");
    }
  }
};
