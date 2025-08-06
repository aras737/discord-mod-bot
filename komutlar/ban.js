const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı banlar.')
    .addUserOption(option => 
      option.setName('kullanici')
        .setDescription('Banlanacak kullanıcı')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const member = interaction.options.getMember('kullanici');

    if (!interaction.member.permissions.has('BanMembers')) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok.', ephemeral: true });
    }

    if (!member) {
      return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    }

    try {
      await member.ban({ reason: `Banned by ${interaction.user.tag}` });
      await interaction.reply(`✅ ${member.user.tag} başarıyla banlandı.`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Ban işlemi başarısız.', ephemeral: true });
    }
  }
};
