const { SlashCommandBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Yapay zekaya bir şey sor")
    .addStringOption(option =>
      option.setName("soru")
        .setDescription("Sorunu yaz")
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString("soru");
    await interaction.deferReply(); // bekleme süresi için

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(question);
      const reply = result.response.text();

      await interaction.editReply(reply);
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Yapay zeka ile konuşurken bir hata oluştu!");
    }
  }
};
