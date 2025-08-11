const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Belirtilen kullanıcıyı yasaktan kaldırır.')
    .addStringOption(option =>
      option.setName('kullanici_id')
        .setDescription('Yasaktan kaldırmak istediğin kullanıcının ID\'si')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('kullanici_id');

    try {
      // Ban listesinde kullanıcıyı ara
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);

      if (!ban) {
        return interaction.reply({ content: '❌ Bu ID ile yasaklı kullanıcı bulunamadı.', ephemeral: true });
      }

      // Banı kaldır
      await interaction.guild.members.unban(userId);
      return interaction.reply({ content: `✅ Kullanıcı (<@${userId}>) yasaktan kaldırıldı.`, ephemeral: false });

    } catch (err) {
      console.error(err);
      return interaction.reply({ content: '❌ Yasak kaldırılırken bir hata oluştu.', ephemeral: true });
    }
  }
};
