const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('🎫 Bilet paneli oluşturur (Yönetici komutu)'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Destek Sistemi')
      .setDescription('Destek almak için aşağıdaki **Butona** tıklayın.')
      .setColor('Blue');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket_menu')
        .setLabel('📩 Bilet Oluştur')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: '✅ Panel gönderildi!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
