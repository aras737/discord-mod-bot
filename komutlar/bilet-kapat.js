const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet-kapat')
    .setDescription('Mevcut bilet kanalını kapatır.'),

  async execute(interaction) {
    const channel = interaction.channel;

    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Bu komutu sadece bilet kanallarında kullanabilirsin.', ephemeral: true });
    }

    try {
      await interaction.reply({ content: '🗑️ Bilet kanalı 5 saniye içinde kapanacak...' });
      setTimeout(() => {
        channel.delete().catch(console.error);
      }, 5000);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Bilet kanalı kapatılırken hata oluştu.', ephemeral: true });
    }
  },
};
