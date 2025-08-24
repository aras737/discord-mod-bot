const { SlashCommandBuilder } = require('discord.js');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Yapay zekaya soru sor')
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Sorunu veya mesajını yaz')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const userMessage = interaction.options.getString('mesaj');

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sen bir Discord botusun, kullanıcılara dostça yanıt veriyorsun." },
          { role: "user", content: userMessage }
        ],
      });

      const reply = completion.choices[0].message.content;
      await interaction.editReply(reply);
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Yapay zeka ile konuşurken bir hata oluştu!");
    }
  },
};
