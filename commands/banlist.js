const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ban listesi dosyasının yolu
const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banlist')
    .setDescription('Banlanan kullanıcıların listesini gösterir'),

  async execute(interaction) {
    if (!fs.existsSync(banListPath)) {
      return interaction.reply({ content: '🚫 Henüz hiç ban kaydı yok.', ephemeral: true });
    }

    const banData = JSON.parse(fs.readFileSync(banListPath, 'utf8'));

    if (Object.keys(banData).length === 0) {
      return interaction.reply({ content: '🚫 Ban listesi boş.', ephemeral: true });
    }

    let list = '';
    for (const [id, info] of Object.entries(banData)) {
      list += `👤 **${info.tag}** (${id})\n📝 Sebep: ${info.reason}\n🔨 Mod: ${info.moderator}\n📅 Tarih: <t:${Math.floor(new Date(info.date).getTime() / 1000)}:f>\n\n`;
    }

    // Discord mesaj sınırına dikkat
    if (list.length > 2000) {
      list = list.slice(0, 1990) + '\n... (liste uzun, bazıları gösterilmedi)';
    }

    await interaction.reply({ content: `📄 **Ban Listesi:**\n\n${list}`, ephemeral: false });
  }
};
