const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yetkiac")
    .setDescription("Tüm komutlarda Admin ve üstü yetkisini aktif eder.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // sadece Admin görebilir

  async execute(interaction, client) {
    // Yapan kişi admin değilse izin verme
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmak için **Yönetici** iznin olmalı.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: "⏳ Tüm komutlara Admin yetkisi atanıyor...",
      ephemeral: true,
    });

    try {
      const guild = interaction.guild;
      const commands = await client.application.commands.fetch({ guildId: guild.id });

      for (const cmd of commands.values()) {
        await client.application.commands.edit(cmd.id, {
          default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        });
      }

      await interaction.editReply({
        content: "✅ Tüm komutlara Admin ve üstü yetkisi başarıyla atandı!",
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: "❌ Komut yetkileri ayarlanırken hata oluştu!",
        ephemeral: true,
      });
    }
  },
};
