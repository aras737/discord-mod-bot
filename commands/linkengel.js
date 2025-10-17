const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  Events,
  EmbedBuilder
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link-engel")
    .setDescription("Sunucuda tüm linkleri engelleme sistemini açar veya kapatır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("durum")
        .setDescription("Link engelleme sistemini aç veya kapat")
        .addChoices(
          { name: "Aç", value: "aç" },
          { name: "Kapat", value: "kapat" }
        )
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("log-kanalı")
        .setDescription("Logların gönderileceği kanal")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const durum = interaction.options.getString("durum");
    const logChannel = interaction.options.getChannel("log-kanalı");

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.",
        ephemeral: true
      });
    }

    if (durum === "aç") {
      await db.set(`linkEngel_${interaction.guild.id}`, true);
      if (logChannel) await db.set(`linkEngelLog_${interaction.guild.id}`, logChannel.id);

      await interaction.reply({
        content: `✅ Link engelleme sistemi **aktif edildi.** ${logChannel ? `Loglar ${logChannel} kanalına gönderilecek.` : ""}`,
        ephemeral: true
      });
    } else {
      await db.delete(`linkEngel_${interaction.guild.id}`);
      await interaction.reply({
        content: "🚫 Link engelleme sistemi **devre dışı bırakıldı.**",
        ephemeral: true
      });
    }

    if (client.linkEngelEventKuruldu) return;
    client.linkEngelEventKuruldu = true;

    client.on(Events.MessageCreate, async message => {
      if (!message.guild || message.author.bot) return;

      const aktif = await db.get(`linkEngel_${message.guild.id}`);
      if (!aktif) return;

      // 🔥 Tüm bağlantı biçimlerini kapsayan gelişmiş regex
      const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+|discord\.com\/invite\/[^\s]+)/gi;

      if (linkRegex.test(message.content)) {
        if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const logChannelId = await db.get(`linkEngelLog_${message.guild.id}`);
        const logChannel = message.guild.channels.cache.get(logChannelId);

        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle("🚫 Link Engellendi")
          .setColor("Red")
          .setDescription(
            `**Kullanıcı:** ${message.author} (\`${message.author.tag}\`)\n` +
            `**Kanal:** ${message.channel}\n\n` +
            `**Mesaj:** ${message.content}`
          )
          .setTimestamp();

        if (logChannel) logChannel.send({ embeds: [embed] });

        message.channel.send({
          content: `${message.author}, bu sunucuda link paylaşmak yasak! 🔒`
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      }
    });
  }
};
