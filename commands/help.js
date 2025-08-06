const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tüm komutları ve açıklamalarını gösterir'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Yardım Menüsü')
      .setDescription('Aşağıda botta bulunan komutların listesi ve açıklamaları yer almaktadır:')
      .setColor('Blue')
      .addFields(
        {
          name: '/ban',
          value: '🚫 Bir kullanıcıyı sunucudan banlamanızı sağlar. (Yetki: BanMembers)',
        },
        {
          name: '/kick',
          value: '👢 Bir kullanıcıyı sunucudan atmanızı sağlar. (Yetki: KickMembers)',
        },
        {
          name: '/duyuru',
          value: '📢 Seçilen kanala duyuru gönderir. (Yetki: Mesajları Yönet)',
        },
        {
          name: '/help',
          value: '📖 Bu yardım menüsünü gösterir.',
        }
      )
      .setFooter({ text: 'TPA TKA Yönetim Botu Yardım Sistemi' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
