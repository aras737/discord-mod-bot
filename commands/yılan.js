// commands/yilan.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yilan")
    .setDescription("🐍 Yılan oyununu oyna!"),

  async execute(interaction) {
    const boardSize = 5;
    let snake = [{ x: 2, y: 2 }];
    let apple = { x: Math.floor(Math.random() * boardSize), y: Math.floor(Math.random() * boardSize) };
    let direction = { x: 0, y: 0 };
    let score = 0;

    function drawBoard() {
      let board = "";
      for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
          if (snake.some(s => s.x === x && s.y === y)) board += "🟩"; 
          else if (apple.x === x && apple.y === y) board += "🍎"; 
          else board += "⬛";
        }
        board += "\n";
      }
      return board;
    }

    const embed = new EmbedBuilder()
      .setTitle("🐍 Yılan Oyunu")
      .setDescription(drawBoard())
      .setFooter({ text: `Skor: ${score}` });

    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("up").setEmoji("⬆️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("left").setEmoji("⬅️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("down").setEmoji("⬇️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("right").setEmoji("➡️").setStyle(ButtonStyle.Primary)
    );

    const message = await interaction.reply({ embeds: [embed], components: [controls], fetchReply: true });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: "Bu oyun sana ait değil!", ephemeral: true });
      }

      if (btn.customId === "up") direction = { x: 0, y: -1 };
      if (btn.customId === "down") direction = { x: 0, y: 1 };
      if (btn.customId === "left") direction = { x: -1, y: 0 };
      if (btn.customId === "right") direction = { x: 1, y: 0 };

      // Hareket et
      const newHead = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

      // Çarpma kontrolü
      if (
        newHead.x < 0 || newHead.x >= boardSize ||
        newHead.y < 0 || newHead.y >= boardSize ||
        snake.some(s => s.x === newHead.x && s.y === newHead.y)
      ) {
        collector.stop("gameover");
        return btn.update({
          embeds: [new EmbedBuilder().setTitle("💀 Oyun Bitti").setDescription(`Skorun: ${score}`)],
          components: []
        });
      }

      snake.unshift(newHead);

      // Elma yeme
      if (newHead.x === apple.x && newHead.y === apple.y) {
        score++;
        apple = { x: Math.floor(Math.random() * boardSize), y: Math.floor(Math.random() * boardSize) };
      } else {
        snake.pop();
      }

      const newEmbed = new EmbedBuilder()
        .setTitle("🐍 Yılan Oyunu")
        .setDescription(drawBoard())
        .setFooter({ text: `Skor: ${score}` });

      await btn.update({ embeds: [newEmbed], components: [controls] });
    });

    collector.on("end", async (_, reason) => {
      if (reason !== "gameover") {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("⏳ Süre Doldu").setDescription(`Skorun: ${score}`)],
          components: []
        });
      }
    });
  }
};
