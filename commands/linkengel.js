const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  Events
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link-engel")
    .setDescription("Sunucudaki tüm bağlantıları engelleme sistemini açar veya kapatır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("durum")
        .setDescription("Link engelleme sistemini aç veya kapat.")
        .addChoices(
          { name: "Aç", value: "ac" },
          { name: "Kapat", value: "kapat" }
        )
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("log-kanali")
        .setDescription("Engellenen mesajların loglanacağı kanal.")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const durum = interaction.options.getString("durum");
    const logChannel = interaction.options.getChannel("log-kanali");

    if (durum === "ac") {
      await db.set(`linkEngel_${interaction.guild.id}`, true);
      if (logChannel) await db.set(`linkEngelLog_${interaction.guild.id}`, logChannel.id);
      await interaction.reply({
        content: `✅ Link engelleme sistemi aktif edildi. ${logChannel ? `Log kanalı: ${logChannel}` : ""}`,
        ephemeral: true
      });
    } else {
      await db.delete(`linkEngel_${interaction.guild.id}`);
      await interaction.reply({ content: "🚫 Link engelleme sistemi devre dışı bırakıldı.", ephemeral: true });
    }

    // ✅ Event bir kez kurulacak (tekrarlamasın)
    if (client.linkEngelKuruldu) return;
    client.linkEngelKuruldu = true;

    client.on(Events.MessageCreate, async (message) => {
      if (!message.guild || message.author.bot) return;

      const aktif = await db.get(`linkEngel_${message.guild.id}`);
      if (!aktif) return;

      // 🔥 Tüm link türlerini kapsayan gelişmiş regex
      const linkRegex = /(https?:\/\/|www\.|discord\.gg|discord\.com\/invite)/i;

      // 🔹 Eğer link içeriyorsa ve kullanıcı admin değilse:
      if (linkRegex.test(message.content)) {
        if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        // Mesajı sil
        await message.delete().catch(() => {});

        // Log kanalını al
        const logChannelId = await db.get(`linkEngelLog_${message.guild.id}`);
        const logChannel = message.guild.channels.cache.get(logChannelId);

        // Embed log
        const embed = new EmbedBuilder()
          .setTitle("🚫 Link Engellendi")
          .setColor("Red")
          .addFields(
            { name: "Kullanıcı", value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
            { name: "Kanal", value: `${message.channel}`, inline: true },
            { name: "Mesaj", value: message.content.substring(0, 1024) || "Yok" }
          )
          .setTimestamp();

        if (logChannel) await logChannel.send({ embeds: [embed] });

        // Kullanıcıya uyarı
        message.channel.send({
          content: `${message.author}, bu sunucuda **link paylaşmak yasaktır!** 🔒`
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      }
    });
  }
};
