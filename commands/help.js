const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardım')
    .setDescription('Tüm komutları gösterir'),
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        {
          title: '📚 Komut Listesi',
          description: `> **/ping** → Botun çalıştığını test eder.\n> **/yardım** → Bu mesajı gösterir.`,
          color: 0x5865f2
        }
      ],
      ephemeral: true
    });
  }
};
