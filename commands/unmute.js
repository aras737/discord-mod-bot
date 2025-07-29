const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Susturulan kullanıcının susturmasını kaldırır.')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Susturması kaldırılacak kullanıcı').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

    try {
      await member.timeout(null);
      interaction.reply(`${user} artık susturulmadı.`);
    } catch (err) {
      interaction.reply({ content: 'Susturma kaldırılamadı.', ephemeral: true });
    }
  }
};
