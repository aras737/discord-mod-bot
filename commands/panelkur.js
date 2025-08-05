const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Destek talebi panelini oluşturur'),

  async execute(interaction) {
    const embed = new MessageEmbed()
      .setTitle('🎫 Destek Talebi Oluştur')
      .setDescription(`Butona tıklayarak bir destek bileti açabilirsiniz.\n\n📌 **Kurallar:**\n> ❗ Gereksiz ticket açmayın\n> 🕒 Sabırlı olun\n> 🙋 Net şekilde sorununuzu belirtin`)
      .setColor('#2f3136');

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('open_ticket')
        .setLabel('🎟️ Ticket Aç')
        .setStyle('PRIMARY')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
