const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet')
    .setDescription('Bilet oluşturma panelini gönderir.'),

  async execute(interaction) {
    await interaction.client.emit('interactionCreate', interaction); 
    // index.js içinde zaten bilet panelini gönderen kod var
  }
};
