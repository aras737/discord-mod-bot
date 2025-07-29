const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı banlar.')
    .addUserOption(option => 
      option.setName('kullanıcı').setDescription('Banlanacak kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('sebep').setDescription('Ban sebebi').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const member = interaction.guild.members.cache.get(user.id);
    
    if (!member) return await interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

    await member.ban({ reason }).catch(err => {
      return interaction.reply({ content: '❌ Ban işlemi başarısız.', ephemeral: true });
    });

    await interaction.reply(`✅ ${user.tag} banlandı. Sebep: ${reason}`);
  }
};
