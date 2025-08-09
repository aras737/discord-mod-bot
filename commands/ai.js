// commands/ai.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '../data/kb.json');
if (!fs.existsSync(kbPath)) fs.writeFileSync(kbPath, JSON.stringify({}, null, 2));

function loadKB() {
  return JSON.parse(fs.readFileSync(kbPath, 'utf8'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Basit yerel AI: bilgi tabanından cevap verir (alkışlı).')
    .addStringOption(opt => opt.setName('soru').setDescription('Sorunu yaz').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false }); // alkış reaksiyonu için public cevap
    const question = interaction.options.getString('soru').toLowerCase().trim();
    const kb = loadKB();

    // Basit eşleme: içeren anahtarları sırayla kontrol et
    let foundKey = null;
    for (const key of Object.keys(kb)) {
      const k = key.toLowerCase();
      if (question.includes(k) || k.includes(question) || question === k) {
        foundKey = key;
        break;
      }
    }

    if (!foundKey) {
      await interaction.editReply({
        content: `Üzgünüm, bunu bilmiyorum. Eğer izin verirsen yöneticiler KB'ye ekleyebilir.`,
      });
      return;
    }

    const answer = kb[foundKey];
    const embed = new EmbedBuilder()
      .setTitle('🤖 AI Cevap')
      .setDescription(answer)
      .setColor('Blurple')
      .setFooter({ text: `KB anahtar: ${foundKey}` })
      .setTimestamp();

    const replyMsg = await interaction.editReply({ embeds: [embed] });
    // Alkış reaksiyonu ekle
    try { await replyMsg.react('👏'); } catch (e) { /* reaksiyon eklenemezse görmezden gel */ }
  }
};
