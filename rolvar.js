const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolver')
    .setDescription('Bir üyeye rol verir.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Rol verilecek kullanıcı')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Verilecek rol')
        .setRequired(true)),

  async execute(interaction) {
    // Komutu kullananın yetkisini kontrol et (örnek: Yönetici yetkisi)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: '🚫 Bu komutu kullanmak için rol yönetme yetkin olmalı.', ephemeral: true });
    }

    const member = interaction.options.getMember('kullanici');
    const role = interaction.options.getRole('rol');

    if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
    if (!role) return interaction.reply({ content: 'Rol bulunamadı.', ephemeral: true });

    // Botun rolü, verilecek rolden yüksek olmalı
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return interaction.reply({ content: '🚫 Bu rolü veremem. Rol benim en yüksek rolümden yüksek.', ephemeral: true });
    }

    // Üyeye rolü ver
    try {
      await member.roles.add(role);
      await interaction.reply({ content: `${member} kullanıcısına ${role} rolü verildi.`, ephemeral: false });
    } catch (error) {
      console.error('Rol verme hatası:', error);
      await interaction.reply({ content: '🚫 Rol verilirken bir hata oluştu.', ephemeral: true });
    }
  },
};
