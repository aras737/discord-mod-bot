const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar.')
    .addUserOption(option => 
      option.setName('kullanıcı').setDescription('Kicklenecek kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('sebep').setDescription('Kick sebebi').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const member = interaction.guild.members.cache.get(user.id);
    
    if (!member) return await interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

    await member.kick(reason).catch(err => {
      return interaction.reply({ content: '❌ Kick işlemi başarısız.', ephemeral: true });
    });

    await interaction.reply(`✅ ${user.tag} sunucudan atıldı. Sebep: ${reason}`);
  }
};
