const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolal')
    .setDescription('Bir kullanıcıdan rol alır.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Rol alınacak kullanıcı')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Alınacak rol')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getMember('kullanıcı');
    const role = interaction.options.getRole('rol');

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: '❌ Rol kaldırma iznim yok.', ephemeral: true });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: '❌ Bu rolü kaldıramam çünkü rol sıramdan yukarıda.', ephemeral: true });
    }

    try {
      await targetUser.roles.remove(role);
      await interaction.reply({ content: `✅ ${targetUser} adlı kullanıcıdan ${role} rolü alındı.` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Rol alınırken bir hata oluştu.', ephemeral: true });
    }
  }
};
