const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Bir kullanıcıyı susturur.')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addIntegerOption(option =>
      option.setName('süre').setDescription('Süre (dakika)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  
  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const duration = interaction.options.getInteger('süre');
    const member = interaction.guild.members.cache.get(user.id);
    
    if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

    try {
      await member.timeout(duration * 60 * 1000, 'Susturuldu');
      interaction.reply(`${user} ${duration} dakika susturuldu.`);
    } catch (err) {
      interaction.reply({ content: 'Susturma başarısız oldu.', ephemeral: true });
    }
  }
};
