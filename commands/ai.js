const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Eğitim log ve kayıt sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // 🔧 KURULUM
    .addSubcommand(sub =>
      sub
        .setName("kur")
        .setDescription("Eğitim log kanalını ayarla")
        .addChannelOption(opt =>
          opt
            .setName("logs")
            .setDescription("Log kanalı")
            .setRequired(true)
        )
    )

    // 📝 KAYIT
    .addSubcommand(sub =>
      sub
        .setName("kayit")
        .setDescription("Eğitim kaydı alır (SS zorunlu)")
    )

    // 📋 LİSTE
    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Bir eğitmenin kaç eğitim verdiğini gösterir")
        .addStringOption(opt =>
          opt
            .setName("isim")
            .setDescription("Eğitmen adı")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    await interaction.deferReply({ ephemeral: true });

    /* ================= KUR ================= */
    if (sub === "kur") {
      const logChannel = interaction.options.getChannel("logs");
      await db.set(`egitim.${guildId}.kanal`, logChannel.id);

      return interaction.editReply(
        `✅ Eğitim log kanalı ayarlandı: ${logChannel}`
      );
    }

    const logChannelId = await db.get(`egitim.${guildId}.kanal`);
    if (!logChannelId) {
      return interaction.editReply(
        "❌ Log kanalı ayarlı değil. `/egitim kur` kullan."
      );
    }

    const logCh = interaction.guild.channels.cache.get(logChannelId);
    if (!logCh) {
      return interaction.editReply("❌ Log kanalı bulunamadı.");
    }

    /* ================= LİSTE ================= */
    if (sub === "liste") {
      const isim = interaction.options.getString("isim");
      const count = (await db.get(`egitim.${guildId}.sayac.${isim}`)) || 0;

      const embed = new EmbedBuilder()
        .setTitle("📋 Eğitim Sayacı")
        .setDescription(`**${isim}** tarafından verilen toplam eğitim:`)
        .addFields({ name: "Toplam", value: `${count}`, inline: true })
        .setColor(0x2f3136)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    /* ================= KAYIT ================= */
    if (sub === "kayit") {
      await interaction.editReply(
        "📸 **Aşağıdaki formatta mesaj at ve SS ekle:**\n\n" +
        "```\nİsim:\nİsmi:\nSS,Kayıt:\nTag: <@&ROLID>\n```"
      );

      const collector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === interaction.user.id,
        max: 1,
        time: 60000
      });

      collector.on("collect", async (msg) => {
        if (msg.attachments.size === 0) {
          return interaction.followUp({
            content: "❌ SS yok, kayıt alınmadı.",
            ephemeral: true
          });
        }

        const content = msg.content;

        if (
          !content.includes("İsim:") ||
          !content.includes("İsmi:") ||
          !content.includes("SS,Kayıt:") ||
          !content.includes("Tag:")
        ) {
          return interaction.followUp({
            content: "❌ Format hatalı, kayıt alınmadı.",
            ephemeral: true
          });
        }

        const isim = content.split("İsim:")[1]?.split("\n")[0]?.trim();
        const ismi = content.split("İsmi:")[1]?.split("\n")[0]?.trim();
        const tagMatch = content.match(/<@&(\d+)>/);

        if (!isim || !ismi || !tagMatch) {
          return interaction.followUp({
            content: "❌ Bilgiler eksik.",
            ephemeral: true
          });
        }

        const ss = msg.attachments.first();

        const embed = new EmbedBuilder()
          .setTitle("📘 Eğitim Log Kaydı")
          .setColor(0x2f3136)
          .addFields(
            { name: "Eğitmen", value: isim, inline: true },
            { name: "Eğitilen", value: ismi, inline: true },
            { name: "Tag", value: `<@&${tagMatch[1]}>`, inline: false }
          )
          .setImage(ss.url)
          .setTimestamp();

        await logCh.send({ embeds: [embed] });
        await db.add(`egitim.${guildId}.sayac.${isim}`, 1);

        await interaction.followUp({
          content: "✅ Eğitim kaydı başarıyla alındı.",
          ephemeral: true
        });
      });
    }
  }
};
