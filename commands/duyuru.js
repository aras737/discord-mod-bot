const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Belirtilen kanala duyuru gönderir.')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Duyuru gönderilecek kanal')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Gönderilecek duyuru mesajı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Sadece yetkili kullanabilir

  async execute(interaction) {
    const channel = interaction.options.getChannel('kanal');
    const message = interaction.options.getString('mesaj');

    if (!channel.isTextBased()) {
      return interaction.reply({ content: 'Lütfen metin kanalı seçin.', ephemeral: true });
    }

    try {
      await channel.send({ content: `📢 **Duyuru:**\n${message}` });
      await interaction.reply({ content: `✅ Duyuru ${channel} kanalına gönderildi.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Duyuru gönderilirken hata oluştu.', ephemeral: true });
    }
  },
};
