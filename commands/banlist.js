const { SlashCommandBuilder } = require('discord.js');

// Banlananları tutan global dizi (normalde ban komutunda ekleniyor)
// Bu listeyi gerçek projede modüllerle paylaşman lazım
const bannedUsers = [
  // Örnek:
  // { id: '1234567890', tag: 'User#1234', reason: 'Spam', date: new Date() },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banlist')
    .setDescription('Banlanan kullanıcıların listesini gösterir.'),

  async execute(interaction) {
    if (bannedUsers.length === 0) {
      return interaction.reply({ content: 'Henüz banlanan kullanıcı yok.', ephemeral: true });
    }

    const list = bannedUsers
      .map((u, i) => `${i + 1}. **${u.tag}** — Sebep: ${u.reason} — Tarih: ${u.date.toLocaleString()}`)
      .join('\n');

    await interaction.reply({ content: `**Banlanan Kullanıcılar:**\n${list}`, ephemeral: true });
  },
};
