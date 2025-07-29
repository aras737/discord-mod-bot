// commands/help.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Komut listesini gösterir'),
  async execute(interaction) {
    await interaction.reply('Yardım menüsü: /ping, /ban, /kick');
  },
};
