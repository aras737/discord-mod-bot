const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anket')
    .setDescription('4 seçenekli bir anket başlatır.')
    .addStringOption(option =>
      option.setName('soru')
        .setDescription('Anket sorusu')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('secenek1')
        .setDescription('1. Seçenek')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('secenek2')
        .setDescription('2. Seçenek')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('secenek3')
        .setDescription('3. Seçenek')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('secenek4')
        .setDescription('4. Seçenek')
        .setRequired(true)
    ),

  async execute(interaction) {
    const soru = interaction.options.getString('soru');
    const secenek1 = interaction.options.getString('secenek1');
    const secenek2 = interaction.options.getString('secenek2');
    const secenek3 = interaction.options.getString('secenek3');
    const secenek4 = interaction.options.getString('secenek4');

    const embed = new EmbedBuilder()
      .setTitle('📊 Anket')
      .setDescription(`**${soru}**\n\n🅰️ ${secenek1}\n🅱️ ${secenek2}\n🇨 ${secenek3}\n🇩 ${secenek4}`)
      .setColor('Blurple')
      .setFooter({ text: `Anketi başlatan: ${interaction.user.tag}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('a')
        .setLabel('🅰️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('b')
        .setLabel('🅱️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('c')
        .setLabel('🇨')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('d')
        .setLabel('🇩')
        .setStyle(ButtonStyle.Primary),
    );

    const pollMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const votes = { a: 0, b: 0, c: 0, d: 0 };
    const votedUsers = new Set();

    const collector = pollMessage.createMessageComponentCollector({ time: 60000 }); // 1 dakika

    collector.on('collect', async i => {
      if (votedUsers.has(i.user.id)) {
        return i.reply({ content: '❗ Zaten oy verdin!', ephemeral: true });
      }

      votedUsers.add(i.user.id);
      votes[i.customId]++;
      await i.reply({ content: '✅ Oyunuz kaydedildi!', ephemeral: true });
    });

    collector.on('end', async () => {
      const sonuçEmbed = new EmbedBuilder()
        .setTitle('📊 Anket Sonuçları')
        .setDescription(`**${soru}**`)
        .addFields(
          { name: `🅰️ ${secenek1}`, value: `${votes.a} oy`, inline: true },
          { name: `🅱️ ${secenek2}`, value: `${votes.b} oy`, inline: true },
          { name: `🇨 ${secenek3}`, value: `${votes.c} oy`, inline: true },
          { name: `🇩 ${secenek4}`, value: `${votes.d} oy`, inline: true },
        )
        .setColor('Green')
        .setFooter({ text: 'Anket süresi doldu.' });

      await pollMessage.edit({ embeds: [sonuçEmbed], components: [] });
    });
  },
};
