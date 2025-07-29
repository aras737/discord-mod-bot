const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolkontrol')
    .setDescription('Bir kullanıcının belirli bir role sahip olup olmadığını kontrol eder.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Kontrol edilecek kullanıcı')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Kontrol edilecek rol')
        .setRequired(true)),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanıcı');
    const role = interaction.options.getRole('rol');

    if (!member) {
      return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });
    }

    const hasRole = member.roles.cache.has(role.id);

    if (hasRole) {
      await interaction.reply(`✅ ${member.user.tag} adlı kullanıcı **${role.name}** rolüne sahip.`);
    } else {
      await interaction.reply(`❌ ${member.user.tag} adlı kullanıcı **${role.name}** rolüne sahip değil.`);
    }
  }
};
