const { SlashCommandBuilder } = require('discord.js');

const knowledgeBase = {
  "merhaba": "Merhaba! Size nasıl yardımcı olabilirim? 👋",
  "nasılsın": "İyiyim, teşekkür ederim! Sen nasılsın? 😊",
  "hava nasıl": "Bugün hava çok güzel görünüyor! ☀️",
  "teşekkürler": "Rica ederim! Her zaman buradayım. 🤗",
  "sa": "Aleyküm selam! Nasıl yardımcı olabilirim? 🙌"
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Yapay zeka ile sohbet eder.')
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Sorunuzu yazınız')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userMessage = interaction.options.getString('mesaj').toLowerCase().trim();

    const answer = knowledgeBase[userMessage] || "Üzgünüm, bunu anlayamadım. Daha sonra geliştirebilirim. 🤖";

    await interaction.editReply(answer);
  }
};
