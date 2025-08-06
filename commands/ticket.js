const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Bilet sistemi komutu')
    .addSubcommand(subcommand => 
      subcommand.setName('open').setDescription('Yeni bilet açar')),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'open') {
      const guild = interaction.guild;
      const member = interaction.member;

      // Öncelikle bilet kanalı var mı kontrol et (user id'li)
      const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${member.user.id}`);
      if (existingChannel) {
        return interaction.reply({ content: `Zaten açık bir biletin var: ${existingChannel}`, ephemeral: true });
      }

      // Yeni bilet kanalı oluştur
      const ticketChannel = await guild.channels.create({
        name: `ticket-${member.user.id}`,
        type: 0, // text channel
        topic: `Bilet kanalı - ${member.user.tag}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: process.env.TICKET_SUPPORT_ROLE_ID, // Destek ekibi rolü
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
        ],
      });

      // Bilet açıldı mesajı ve kapatma butonu
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Bileti Kapat')
            .setStyle(ButtonStyle.Danger)
        );

      await ticketChannel.send({
        content: `Merhaba ${member}, destek ekibimiz en kısa sürede ilgilenecektir. Lütfen sorununuzu detaylı şekilde yazınız.`,
        components: [row],
      });

      return interaction.reply({ content: `Biletin açıldı: ${ticketChannel}`, ephemeral: true });
    }
  }
};
