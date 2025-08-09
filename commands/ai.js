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
    await interaction.deferReply({ ephemeral: false });
    try {
      const question = interaction.options.getString('soru').toLowerCase().trim();
      const kb = loadKB();

      // Basit eşleme: en iyi anahtarı bul (tam eşleşme veya içeriyorsa)
      let foundKey = null;
      for (const key of Object.keys(kb)) {
        const k = key.toLowerCase();
        if (question === k || question.includes(k) || k.includes(question)) {
          foundKey = key;
          break;
        }
      }

      if (!foundKey) {
        return interaction.editReply({ content: `Üzgünüm, bunu bilmiyorum. Yöneticiler KB'ye ekleyebilir.` });
      }

      const answer = kb[foundKey];
      const embed = new EmbedBuilder()
        .setTitle('🤖 AI Cevap')
        .setDescription(answer)
        .setColor('Blurple')
        .setFooter({ text: `KB anahtar: ${foundKey}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // fetchReply ile son gönderilen mesajı al, sonra reaksiyon ekle
      const replyMsg = await interaction.fetchReply();
      if (replyMsg && replyMsg.react) {
        await replyMsg.react('👏').catch(() => {});
      }
    } catch (err) {
      console.error('ai komut hatası:', err);
      if (!interaction.replied) await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
      else await interaction.editReply({ content: '❌ Bir hata oluştu.' });
    }
  }
};
