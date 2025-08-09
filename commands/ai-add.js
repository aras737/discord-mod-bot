// commands/ai-add.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '../data/kb.json');
if (!fs.existsSync(kbPath)) fs.writeFileSync(kbPath, JSON.stringify({}, null, 2));

function loadKB() { return JSON.parse(fs.readFileSync(kbPath, 'utf8')); }
function saveKB(data) { fs.writeFileSync(kbPath, JSON.stringify(data, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-add')
    .setDescription('KB\'ye yeni soru-cevap ekler. (Yetkili)')
    .addStringOption(opt => opt.setName('soru').setDescription('KB anahtarı (kısa)').setRequired(true))
    .addStringOption(opt => opt.setName('cevap').setDescription('Cevap metni').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const key = interaction.options.getString('soru').trim();
    const answer = interaction.options.getString('cevap').trim();

    const kb = loadKB();
    kb[key] = answer;
    saveKB(kb);

    await interaction.reply({ content: `✅ KB'ye eklendi: **${key}**`, ephemeral: true });
  }
};
