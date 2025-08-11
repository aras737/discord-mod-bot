const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir üyeyi sunucudan atar.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Atılacak kullanıcı').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: 'Üye bulunamadı.', ephemeral: true });
      } else {
        return await interaction.reply({ content: 'Üye bulunamadı.', ephemeral: true });
      }
    }

    try {
      await member.kick();

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: `${user.tag} sunucudan atıldı!`, ephemeral: true });
      } else {
        await interaction.reply({ content: `${user.tag} sunucudan atıldı!`, ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Bir hata oluştu.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
      }
    }
  }
};
