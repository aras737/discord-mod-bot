const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki")
    .setDescription("Bottaki tüm slash komutlara izin bazlı erişim uygular")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // sadece admin kullanabilir

  async execute(interaction, client) {
    await interaction.reply({ content: "⏳ Tüm komutlar için yetki kontrolü uygulanıyor...", ephemeral: true });

    try {
      const guild = interaction.guild;
      const commands = await client.application.commands.fetch({ guildId: guild.id });

      // Kullanıcının izinlerini al
      const memberPerms = interaction.member.permissions;

      const accessibleCommands = [];

      commands.forEach(cmd => {
        const requiredPerms = cmd.default_member_permissions ? BigInt(cmd.default_member_permissions) : 0n;

        // Kullanıcı gerekli izinlere sahip mi?
        if ((memberPerms.bitfield & requiredPerms) === requiredPerms) {
          accessibleCommands.push(cmd.name);
        }
      });

      await interaction.editReply({
        content: `✅ Bu komutları kullanabilirsin: ${accessibleCommands.join(", ")}`,
        ephemeral: true
      });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: "❌ Yetki kontrolü uygulanırken bir hata oluştu!", ephemeral: true });
    }
  }
};
