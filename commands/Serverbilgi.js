import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucubilgi')
    .setDescription('Sunucu hakkında detaylı bilgi verir.'),
  
  async execute(interaction) {
    const guild = interaction.guild;

    // Sayfa 1 embed
    const embed1 = new EmbedBuilder()
      .setTitle(`${guild.name} - Sunucu Bilgisi (1/2)`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor('Blue')
      .addFields(
        { name: 'Sunucu Sahibi', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Sunucu ID', value: guild.id, inline: true },
        { name: 'Oluşturulma Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Toplam Üye', value: `${guild.memberCount}`, inline: true },
        { name: 'Boost Seviyesi', value: `Tier ${guild.premiumTier}`, inline: true },
        { name: 'Boost Sayısı', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
      )
      .setFooter({ text: 'Sayfa 1 / 2' })
      .setTimestamp();

    // Sayfa 2 embed
    const embed2 = new EmbedBuilder()
      .setTitle(`${guild.name} - Sunucu Bilgisi (2/2)`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor('Blue')
      .addFields(
        { name: 'Kanal Sayısı', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Rol Sayısı', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Emoji Sayısı', value: `${guild.emojis.cache.size}`, inline: true },
        { name: 'AFK Kanalı', value: guild.afkChannel ? `<#${guild.afkChannel.id}>` : 'Yok', inline: true },
        { name: 'Bölge', value: guild.preferredLocale, inline: true },
        { name: 'Doğrulama Seviyesi', value: guild.verificationLevel.toString(), inline: true },
      )
      .setFooter({ text: 'Sayfa 2 / 2' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⬅️ Geri')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('İleri ➡️')
        .setStyle(ButtonStyle.Primary)
    );

    let currentPage = 0;
    const pages = [embed1, embed2];

    // İlk sayfayı gönder
    const msg = await interaction.reply({ embeds: [pages[currentPage]], components: [row], fetchReply: true, ephemeral: false });

    // Butonlara tepki bekle
    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Bu butonları sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
      }

      if (i.customId === 'next') {
        currentPage++;
      } else if (i.customId === 'prev') {
        currentPage--;
      }

      // Butonları güncelle
      row.components[0].setDisabled(currentPage === 0);
      row.components[1].setDisabled(currentPage === pages.length - 1);

      await i.update({ embeds: [pages[currentPage]], components: [row] });
    });

    collector.on('end', () => {
      row.components.forEach(button => button.setDisabled(true));
      msg.edit({ components: [row] });
    });
  },
};
