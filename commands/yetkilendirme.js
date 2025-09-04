const { SlashCommandBuilder, PermissionFlagsBits, InteractionFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki_roller")
    .setDescription("Tüm slash komutlara rollere göre otomatik yetki uygular.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.reply({
      content: "⏳ Komutlar için rol yetkileri ayarlanıyor...",
      flags: InteractionFlags.Ephemeral // Yeni ve önerilen kullanım
    });

    try {
      const guild = interaction.guild;
      const commands = await guild.commands.fetch();
      const roles = await guild.roles.fetch();

      const fullPermissions = [];
      for (const command of commands.values()) {
        const requiredPerms = command.defaultMemberPermissions;

        if (!requiredPerms) continue;

        const permissions = [];
        roles.forEach(role => {
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

      await interaction.editReply({
        content: "✅ Tüm slash komutlar için rol yetkileri başarıyla uygulandı!",
        flags: InteractionFlags.Ephemeral // Yeni ve önerilen kullanım
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'ApplicationCommandPermissionsTokenMissing') {
        await interaction.editReply({
          content: "❌ Komut yetkileri ayarlanırken bir hata oluştu: Botun yetkileri eksik olabilir. Lütfen 'Uygulamaları Yönet' iznine sahip olduğundan ve botu doğru kapsamlarla eklediğinizden emin olun.",
          flags: InteractionFlags.Ephemeral
        });
      } else {
        await interaction.editReply({
          content: "❌ Rol yetkileri ayarlanırken bir hata oluştu!",
          flags: InteractionFlags.Ephemeral
        });
      }
    }
  },
};
