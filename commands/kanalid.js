const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kanalid')
    .setDescription('Bulunduğun kanalın ID bilgisini verir.'),
  
  async execute(interaction) {
    await interaction.reply({
      content: `📌 Bu kanalın ID'si: \`${interaction.channel.id}\``,
      ephemeral: true
    });
  }
};
