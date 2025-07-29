const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolver')
    .setDescription('Bir kullanıcıya rol verir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Rol verilecek kullanıcı')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Verilecek rol')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getMember('kullanıcı');
    const role = interaction.options.getRole('rol');

    // Hata kontrolleri
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: '❌ Benim rol verme iznim yok.', ephemeral: true });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: '❌ Bu rolü veremem çünkü rol sıramdan yukarıda.', ephemeral: true });
    }

    try {
      await targetUser.roles.add(role);
      await interaction.reply({ content: `✅ ${targetUser} adlı kullanıcıya ${role} rolü verildi.` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Rol verilirken bir hata oluştu.', ephemeral: true });
    }
  }
};
