const { SlashCommandBuilder } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyetim")
    .setDescription("Kendi ehliyetini görüntüle."),

  async execute(interaction) {
    const ehliyet = db.get(`ehliyet_${interaction.user.id}`);

    if (!ehliyet) {
      return interaction.reply({ 
        content: "❌ Henüz ehliyetin yok.", 
        ephemeral: true 
      });
    }

    await interaction.reply(
      `🪪 **Ehliyet Bilgileri**\n👤 Kullanıcı: ${interaction.user}\n📅 Tarih: ${ehliyet.tarih}\n📌 Durum: ${ehliyet.durum}`
    );
  }
};
