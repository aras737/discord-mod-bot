const fs = require('fs');
const path = require('path');
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

const banListPath = path.join(__dirname, '../data/banlist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banlist')
    .setDescription('Banlanan kullanıcıları listeler.'),

  async execute(interaction) {
    if (!fs.existsSync(banListPath)) {
      return interaction.reply({ content: '🚫 Henüz hiç kimse banlanmamış.', ephemeral: true });
    }

    const raw = fs.readFileSync(banListPath);
    const banList = JSON.parse(raw);

    if (banList.length === 0) {
      return interaction.reply({ content: '🚫 Ban listesi boş.', ephemeral: true });
    }

    const list = banList.map((entry, index) => 
      `**${index + 1}.** ${entry.tag} (${entry.userId})\n> Sebep: ${entry.reason}\n> Yetkili: ${entry.bannedBy}\n> Tarih: <t:${Math.floor(new Date(entry.date).getTime() / 1000)}:R>`
    ).join('\n\n');

    await interaction.reply({
      content: `🛑 **Ban Listesi:**\n\n${list}`,
      ephemeral: true // sadece komutu kullanan görsün
    });
  }
};
