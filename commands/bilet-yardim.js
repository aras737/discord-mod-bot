const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet-yardim')
    .setDescription('Bilet sistemi hakkında bilgi verir.'),

  async execute(interaction) {
    await interaction.reply({
      content: `🎫 **Bilet Sistemi Komutları**
- /bilet : Yeni destek bileti açar.
- /bilet-kapat : Açık bilet kanalını kapatır.
- /bilet-yardim : Bu yardım mesajını gösterir.

Yetkililer destek için en kısa sürede size geri dönecektir.`,
      ephemeral: true,
    });
  },
};
