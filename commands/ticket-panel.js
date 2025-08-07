const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Destek talebi (bilet) oluşturur'),

  async execute(interaction) {
    const existing = interaction.guild.channels.cache.find(c =>
      c.name === `ticket-${interaction.user.id}`
    );
    if (existing) {
      return interaction.reply({
        content: `❌ Zaten açık bir biletin var: ${existing}`,
        ephemeral: true
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ],
        },
      ],
    });

    await channel.send({
      content: `${interaction.user}`,
      embeds: [
        new EmbedBuilder()
          .setTitle('🎫 Yeni Destek Talebi')
          .setDescription('👋 Merhaba! Lütfen sorununuzu detaylıca yazın.\nYetkililer en kısa sürede sizinle ilgilenecek.')
          .setColor('Blue')
      ]
    });

    await interaction.reply({
      content: `✅ Destek kanalı oluşturuldu: ${channel}`,
      ephemeral: true
    });
  }
};
