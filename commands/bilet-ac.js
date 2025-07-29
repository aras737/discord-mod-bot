const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet-aç')
    .setDescription('Yeni bir destek bileti açar.'),

  async execute(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    // Bilet kanal adı örneği: ticket-username
    const channelName = `ticket-${member.user.username.toLowerCase()}`;

    // Aynı kullanıcının bilet kanalı varsa uyar
    const existingChannel = guild.channels.cache.find(c => c.name === channelName);
    if (existingChannel) {
      return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${existingChannel}`, ephemeral: true });
    }

    try {
      // Yeni kanal oluştur
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: 0, // GUILD_TEXT
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: member.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
          },
          // İstersen destek ekibinin rolünü de buraya ekle
          // { id: 'DESTEK_EKIBI_ROL_ID', allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      });

      await interaction.reply({ content: `✅ Biletin açıldı: ${ticketChannel}`, ephemeral: true });

      await ticketChannel.send(`Merhaba ${member}, destek talebiniz için burası özel kanalınız. Yetkililer en kısa sürede yardımcı olacaktır.`);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Bilet açılırken hata oluştu.', ephemeral: true });
    }
  },
};
