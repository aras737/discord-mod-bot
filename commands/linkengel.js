const { SlashCommandBuilder, PermissionFlagsBits, Events } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link-engel")
    .setDescription("Discord link engelleme sistemini açar veya kapatır")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(option =>
      option
        .setName("durum")
        .setDescription("Link engelleme sistemini aç/kapat")
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("log-kanal")
        .setDescription("Link engel loglarının gönderileceği kanal")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const durum = interaction.options.getBoolean("durum");
    const logChannel = interaction.options.getChannel("log-kanal");

    await db.set(`linkEngel_${interaction.guild.id}`, durum);
    await db.set(`linkLog_${interaction.guild.id}`, logChannel.id);

    await interaction.reply({
      content: `✅ Link engelleme sistemi ${durum ? "aktif" : "devre dışı"} edildi. Log kanalı: ${logChannel}`,
      ephemeral: true
    });
  }
};

// Event (bunu index.js veya ana dosyaya EKLE!)
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const { QuickDB } = require("quick.db");
const db = new QuickDB();

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  const linkEngel = await db.get(`linkEngel_${message.guild.id}`);
  if (!linkEngel) return;

  const linkRegex = /(discord\.gg|discordapp\.com\/invite|http:\/\/|https:\/\/)/gi;
  if (linkRegex.test(message.content)) {
    try {
      await message.delete();
      const logChannelId = await db.get(`linkLog_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        logChannel.send(`🚫 ${message.author} tarafından gönderilen bir link silindi!`);
      }
    } catch (err) {
      console.error("Mesaj silinemedi:", err);
    }
  }
});
