const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Bot mesajlarını yok say
    if (message.author.bot) return;

    // Mesajı küçük harfe çevir
    const content = message.content.toLowerCase();

    // SA kontrolü
    if (content === "sa") {
      message.reply("Aleykümselam, hoş geldin!");
    }
  }
};
