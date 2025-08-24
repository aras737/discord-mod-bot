const { SlashCommandBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Yapay zekaya Türkçe bir şey sor")
    .addStringOption(option =>
      option.setName("soru")
        .setDescription("Sorunu yaz")
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString("soru");
    await interaction.deferReply();

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Türkçe cevap vermesi için ek talimat
      const result = await model.generateContent(
        `Lütfen her zaman Türkçe cevap ver. Kullanıcının sorusu: ${question}`
      );

      const reply = result.response.text();
      await interaction.editReply(reply);
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Yapay zeka ile konuşurken bir hata oluştu!");
    }
  }
};
