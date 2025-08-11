const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir üyeyi sunucudan atar.')
    .addUserOption(option => 
      option.setName('kullanici')
        .setDescription('Atılacak kullanıcıyı seçin')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Atılma sebebi')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return interaction.reply({ content: 'Bu kullanıcı sunucuda değil.', flags: 64 });
    }

    if (!member.kickable) {
      return interaction.reply({ content: 'Bu kullanıcıyı atamam.', flags: 64 });
    }

    try {
      // Kullanıcıya DM gönder
      await user.send(`Sunucudan atıldınız. Sebep: ${sebep}`).catch(() => {});

      // Üyeyi at
      await member.kick(sebep);

      // Etkileşim yanıtı gönder (fetchReply yerine withResponse kullandık)
      await interaction.reply({ content: `${user.tag} başarıyla atıldı. Sebep: ${sebep}`, flags: 64, withResponse: true });
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Bir hata oluştu.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ Bir hata oluştu.', flags: 64 });
      }
    }
  }
};
