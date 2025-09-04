const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("otoyetki")
    .setDescription("Tüm slash komutları Admin ve üstü yetkiye göre otomatik ayarlar")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.reply({ content: "⏳ Otoyetki sistemi çalışıyor...", ephemeral: true });

    try {
      const guild = interaction.guild;
      const member = interaction.member;
      const memberPerms = member.permissions;

      // Admin veya üstü değilse çık
      if (!memberPerms.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: "❌ Bu komutu kullanmak için Admin yetkin olmalı!", ephemeral: true });
      }

      // Sunucudaki tüm slash komutları al
      const commands = await client.application.commands.fetch({ guildId: guild.id });

      // Her komut için default_member_permissions'i Admin yap
      for (const cmd of commands.values()) {
        await client.application.commands.edit(cmd.id, {
          default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        });
      }

      await interaction.editReply({ content: "✅ Tüm slash komutlar için Admin ve üstü yetki ayarlandı!", ephemeral: true });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: "❌ Otoyetki uygulanırken bir hata oluştu!", ephemeral: true });
    }
  }
};
