const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolid')
    .setDescription('Belirtilen rolün ID\'sini gösterir.')
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Rolü seçiniz.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('rol');

    await interaction.reply({
      content: `🎯 **${role.name}** rolünün ID'si: \`${role.id}\``,
      ephemeral: true // sadece kullanıcı görür
    });
  }
};
