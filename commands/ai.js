const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Yapay zeka ile sohbet eder.')
    .addStringOption(option => option.setName('mesaj').setDescription('Sorunu yaz').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    // JSON dosyasını güvenle oku
    let kbData;
    try {
      const kbRaw = fs.readFileSync('./kg.json', 'utf-8');
      kbData = JSON.parse(kbRaw);
    } catch (e) {
      console.error('JSON yüklenirken hata:', e);
      return interaction.editReply('❌ Bilgi tabanı yüklenemedi!');
    }

    const userMessage = interaction.options.getString('mesaj');

    // Burada AI işlemi yapacaksan devam et...

    // Örnek cevap
    await interaction.editReply(`AI cevap: ${userMessage} 👏`);
  },
};
