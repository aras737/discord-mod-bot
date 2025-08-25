// commands/ai.js
const { SlashCommandBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Yapay zekadan yardım al")
    .addStringOption(option =>
      option
        .setName("soru")
        .setDescription("Normal bir soru sor (Türkçe cevap alırsın)")
    )
    .addStringOption(option =>
      option
        .setName("kod")
        .setDescription("Kod üretmesini iste (örnek: 'Python ile topla fonksiyonu')")
    ),

  async execute(interaction) {
    const question = interaction.options.getString("soru");
    const codeReq = interaction.options.getString("kod");
    await interaction.deferReply();

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      let prompt = "";

      if (codeReq) {
        prompt = `Kullanıcı kod istiyor. Sadece kod bloğu içinde cevap ver. Açıklama yazma. Kod isteği: ${codeReq}`;
      } else if (question) {
        prompt = `Cevaplarını her zaman Türkçe ver. Kullanıcının sorusu: ${question}`;
      } else {
        return interaction.editReply("❌ Bir şey sormalısın!");
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reply = response.text();

      // Discord'un 2000 karakter sınırına göre kesiyoruz
      if (reply.length > 2000) {
        await interaction.editReply(reply.slice(0, 1997) + "...");
      } else {
        await interaction.editReply(reply);
      }
    } catch (error) {
      console.error("AI hata:", error);
      await interaction.editReply("❌ Yapay zeka ile konuşurken bir hata oluştu!");
    }
  }
};
