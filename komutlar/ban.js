// ban.js
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı sunucudan banlar.')
    .addUserOption(option =>
      option.setName('kullanici').setDescription('Banlanacak kullanıcı').setRequired(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const guild = interaction.guild; // Buradan eriş
    const member = guild.members.cache.get(user.id);

    if (!member) {
      return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
    }

    await member.ban();
    await interaction.reply({ content: `${user.tag} sunucudan banlandı.` });
  }
};
