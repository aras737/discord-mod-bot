const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki_roller")
    .setDescription("Tüm slash komutlara rollere göre otomatik yetki uygular.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.reply({ content: "⏳ Komutlar için rol yetkileri ayarlanıyor...", ephemeral: true });

    try {
      const guild = interaction.guild;
      const commands = await guild.commands.fetch(); // Sunucuya ait komutları çek
      const roles = await guild.roles.fetch();

      const fullPermissions = [];
      for (const command of commands.values()) {
        const requiredPerms = command.defaultMemberPermissions;

        // Komutun varsayılan bir izni yoksa yetkilendirme yapma
        if (!requiredPerms) continue;

        const permissions = [];
        // Sadece rolleri dikkate al
        roles.forEach(role => {
          // Eğer rol, komutun gerektirdiği izinlerin tamamına sahipse
          if (requiredPerms && role.permissions.has(requiredPerms)) {
            permissions.push({
              id: role.id,
              type: "ROLE",
              permission: true,
            });
          }
        });

        fullPermissions.push({
          id: command.id,
          permissions: permissions,
        });
      }

      await guild.commands.permissions.set({ fullPermissions });

      await interaction.editReply({ content: "✅ Tüm slash komutlar için rol yetkileri başarıyla uygulandı!", ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "❌ Rol yetkileri ayarlanırken bir hata oluştu!", ephemeral: true });
    }
  },
};
