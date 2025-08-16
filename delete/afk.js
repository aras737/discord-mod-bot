const { SlashCommandBuilder } = require('discord.js');
const afkMap = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('AFK moduna geçer.')
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('AFK sebebiniz')
        .setRequired(false)
    ),
  async execute(interaction) {
    const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
    afkMap.set(interaction.user.id, reason);

    await interaction.reply({ content: `🔕 ${reason} sebebiyle AFK oldunuz.`, ephemeral: true });
  },
  afkMap
};
