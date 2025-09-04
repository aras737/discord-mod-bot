const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki")
    .setDescription("Bottaki tüm slash komutlar için izin bazlı erişim uygular")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // sadece admin kullanabilir

  async execute(interaction, client) {
    await interaction.reply({ content: "⏳ Kullanıcı izinleri kontrol ediliyor...", ephemeral: true });

    try {
      const guild = interaction.guild;
      const memberPerms = interaction.member.permissions;
      const commands = await client.application.commands.fetch({ guildId: guild.id });

      const accessibleCommands = [];

      commands.forEach(cmd => {
        // Komutun gerekli izinleri
        const requiredPerms = cmd.default_member_permissions ? BigInt(cmd.default_member_permissions) : 0n;

        // Kullanıcının izinleri yeterliyse ekle
        if ((memberPerms.bitfield & requiredPerms) === requiredPerms) {
          accessibleCommands.push(cmd.name);
        }
      });

      if (accessibleCommands.length === 0) {
        return await interaction.editReply({
          content: "❌ Hiçbir komutu kullanmak için yeterli iznin yok!",
          ephemeral: true
        });
      }

      await interaction.editReply({
        content: `✅ Kullanabileceğin komutlar: ${accessibleCommands.join(", ")}`,
        ephemeral: true
      });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: "❌ Otoyetki uygulanırken bir hata oluştu!", ephemeral: true });
    }
  }
};
