const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki")
    .setDescription("Tüm slash komutları otomatik olarak rol ve izin bazlı kontrol eder")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.reply({ content: "⏳ Otoyetki sistemi çalışıyor...", ephemeral: true });

    try {
      const guild = interaction.guild;
      const member = interaction.member;
      const memberPerms = member.permissions.bitfield;

      // Tüm slash komutları al
      const commands = await client.application.commands.fetch({ guildId: guild.id });

      const accessibleCommands = [];

      commands.forEach(cmd => {
        const requiredPerms = cmd.default_member_permissions ? BigInt(cmd.default_member_permissions) : 0n;
        if ((BigInt(memberPerms) & requiredPerms) === requiredPerms) accessibleCommands.push(cmd.name);
      });

      if (accessibleCommands.length === 0)
        return interaction.editReply({ content: "❌ Kullanabileceğin komut yok!", ephemeral: true });

      await interaction.editReply({ content: `✅ Kullanabileceğin komutlar: ${accessibleCommands.join(", ")}`, ephemeral: true });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: "❌ Otoyetki çalışırken hata oluştu!", ephemeral: true });
    }
  }
};
