const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet')
    .setDescription('Destek bilet menüsünü açar, lütfen aşağıdan kategori seçin.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎟️ Bilet Sistemi')
      .setDescription(
        '**Lütfen aşağıdaki menüden destek kategorinizi seçin.**\n\n' +
        '📩 **Destek:** Genel sorunlar ve sorular için.\n' +
        '🚫 **Şikayet:** Sunucu ile ilgili problemleri bildirmek için.\n' +
        '📄 **Başvuru:** Sunucu veya ekip başvuruları için.\n\n' +
        '⚠️ _Bilet açarken lütfen kurallara uyacağınızı unutmayın!_'
      )
      .setColor('#00AAFF');

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('Bilet kategorisi seçin')
        .addOptions([
          {
            label: 'Destek',
            description: 'Genel destek için bilet açın',
            value: 'destek',
            emoji: '📩',
          },
          {
            label: 'Şikayet',
            description: 'Sunucu ile ilgili şikayetlerinizi bildirin',
            value: 'sikayet',
            emoji: '🚫',
          },
          {
            label: 'Başvuru',
            description: 'Sunucuya veya ekibe başvuru yapın',
            value: 'basvuru',
            emoji: '📄',
          },
        ])
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
