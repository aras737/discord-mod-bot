const { SlashCommandBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("şablon")
    .setDescription("Yapay zekadan Discord sunucu şablonu oluştur.")
    .addStringOption(option =>
      option.setName("istek")
        .setDescription("Şablon için istediğin tür (ör: Askeri, Oyun, Sohbet)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const istek = interaction.options.getString("istek");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
      Sen bir Discord sunucu şablon üreticisisin.
      Kullanıcının isteğine göre direkt şablon linki ver.
      Şablonun ismi: Konyalım
      İstek: ${istek}
      Sadece geçerli https://discord.new/ ile başlayan şablon linkini döndür.
      Ekstra açıklama yazma.`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();

      await interaction.editReply(`✅ İşte **Konyalım** şablonun hazır:\n${response}`);

    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Şablon oluşturulurken bir hata oldu.");
    }
  }
};
