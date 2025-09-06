const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const os = require("os");

const botOwnerId = process.env.BOT_OWNER_ID || "SAHİP_ID"; 
// Railway’de BOT_OWNER_ID diye bir değişken ekleyebilirsin.

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botbilgi")
    .setDescription("Bot hakkında bilgi ve Railway bilgileri gösterir."),

  async execute(interaction, client) {
    const uptime = process.uptime(); 
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    // Railway ortam değişkenleri (örnek)
    const projectName = process.env.RAILWAY_PROJECT_NAME || "Bilinmiyor";
    const env = process.env.NODE_ENV || "production";
    const region = process.env.RAILWAY_REGION || "Bilinmiyor";

    const embed = new EmbedBuilder()
      .setColor("DarkBlue")
      .setTitle("🤖 Bot Bilgileri")
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: "👑 Bot Sahibi", value: `<@${botOwnerId}>`, inline: true },
        { name: "🗓️ Aktif Süre", value: `${days} gün, ${hours} saat, ${minutes} dk`, inline: true },
        { name: "📜 Komut Sayısı", value: `${client.commands.size}`, inline: true },
        { name: "🌍 Sunucu Sayısı", value: `${client.guilds.cache.size}`, inline: true },
        { name: "👥 Kullanıcı Sayısı", value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
        { name: "⚙️ Node.js", value: `${process.version}`, inline: true },
        { name: "💻 Sistem", value: `${os.type()} ${os.release()} (${os.arch()})`, inline: true },
        { name: "📦 Railway Proje", value: projectName, inline: true },
        { name: "🌐 Railway Bölge", value: region, inline: true },
        { name: "⚡ Node Env", value: env, inline: true }
      )
      .setFooter({ text: "Bot & Railway İstatistikleri", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
