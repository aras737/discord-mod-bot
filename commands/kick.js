const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar.')
    .addUserOption(option => option.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true)),
  
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const member = interaction.guild.members.cache.get(user.id);
    
    if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', flags: 64 });

    if (!member.kickable) return interaction.reply({ content: 'Bu kullanıcıyı atamam.', flags: 64 });

    try {
      // Kullanıcıya DM gönder
      await user.send(`Merhaba, **${interaction.guild.name}** sunucusundan atıldınız.`).catch(() => {
        // DM engelliyse sessizce geç
      });

      // Sunucudan at
      await member.kick();

      // Komut sahibine başarı mesajı gönder
      await interaction.reply({ content: `${user.tag} başarıyla sunucudan atıldı ve DM gönderildi.`, flags: 64 });

    } catch (error) {
      console.error(error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: 'Bir hata oluştu.', flags: 64 });
      } else {
        await interaction.reply({ content: 'Bir hata oluştu.', flags: 64 });
      }
    }
  }
};
