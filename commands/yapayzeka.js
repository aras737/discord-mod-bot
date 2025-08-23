import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "sor") {
    const soru = interaction.options.getString("soru");
    await interaction.deferReply();

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: soru }],
      });

      const cevap = completion.choices[0].message.content;
      await interaction.editReply(cevap);
    } catch (err) {
      console.error(err);
      await interaction.editReply("Bir hata oluştu 😢");
    }
  }
});
