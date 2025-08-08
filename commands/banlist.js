const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banlist')
    .setDescription('Banlanan kullanıcıların listesini gösterir'),

  async execute(interaction) {
    try {
      if (!fs.existsSync(banListPath)) {
        return interaction.reply({ content: '❌ Henüz kimse banlanmamış.', ephemeral: true });
      }

      const raw = fs.readFileSync(banListPath, 'utf8');
      const list = JSON.parse(raw);

      const entries = Object.entries(list);
      if (entries.length === 0) {
        return interaction.reply({ content: '📂 Ban listesi boş.', ephemeral: true });
      }

      const output = entries.map(([id, info], i) => 
        `\`${i + 1}.\` 👤 **${info.tag}** (ID: \`${id}\`)\n` +
        `📝 Sebep: ${info.reason}\n` +
        `🔨 Yetkili: ${info.moderator}\n` +
        `🕒 Tarih: <t:${Math.floor(new Date(info.date).getTime() / 1000)}:F>`
      ).join('\n\n');

      return interaction.reply({ content: `📄 **Ban Listesi:**\n\n${output}`, ephemeral: true });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: '❌ Liste alınırken hata oluştu.', ephemeral: true });
    }
  }
};
