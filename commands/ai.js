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

    // 🔧 KURULUM
    .addSubcommand(sub =>
      sub
        .setName("kur")
        .setDescription("Eğitim log kanalını ayarla")
        .addChannelOption(opt =>
          opt
            .setName("logs")
            .setDescription("Eğitim log kanalı")
            .setRequired(true)
        )
    )

    // 📋 LİSTE
    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Bir eğitmenin verdiği eğitim sayısını gösterir")
        .addStringOption(opt =>
          opt
            .setName("isim")
            .setDescription("Eğitmen adı")
            .setRequired(true)
        )
    )

    // 📝 KAYIT
    .addSubcommand(sub =>
      sub
        .setName("kayit")
        .setDescription("Eğitim kaydı oluşturur (SS zorunlu)")
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    /* ---------- KUR ---------- */
    if (sub === "kur") {
      const logChannel = interaction.options.getChannel("logs");
      await db.set(`egitim.${guildId}.kanal`, logChannel.id);

      return interaction.editReply(
        `Log kanalı başarıyla ayarlandı: ${logChannel}`
      );
    }

    const logChannelId = await db.get(`egitim.${guildId}.kanal`);
    if (!logChannelId) {
      return interaction.editReply(
        "Log kanalı ayarlı değil. Önce `/egitim kur` kullanın."
      );
    }

    const logCh = interaction.guild.channels.cache.get(logChannelId);
    if (!logCh) {
      return interaction.editReply("Log kanalı bulunamadı.");
    }

    /* ---------- LİSTE ---------- */
    if (sub === "liste") {
      const isim = interaction.options.getString("isim");
      const count =
        (await db.get(`egitim.${guildId}.sayac.${isim}`)) || 0;

      const embed = new EmbedBuilder()
        .setTitle("Eğitim Sayacı")
        .setDescription(
          `**${isim}** tarafından verilen toplam eğitim sayısı:\n\n**${count}**`
        )
        .setColor(0x2f3136)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    /* ---------- KAYIT ---------- */
    if (sub === "kayit") {
      await interaction.editReply(
        "Aşağıdaki formatta mesaj gönderin ve **SS ekleyin**:\n\n" +
        "```\nİsim:\nİsmi:\nSS,Kayıt:\nTag: <@&ROLID>\n```"
      );

      const collector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === interaction.user.id,
        max: 1,
        time: 60000
      });

      collector.on("collect", async (msg) => {
        const content = msg.content;

        if (
          !content.includes("İsim:") ||
          !content.includes("İsmi:") ||
          !content.includes("SS,Kayıt:") ||
          !content.includes("Tag:")
        ) {
          return interaction.followUp({
            content: "Mesaj formatı hatalı. Kayıt alınmadı.",
            ephemeral: true
          });
        }

        if (msg.attachments.size === 0) {
          return interaction.followUp({
            content: "SS bulunamadı. Kayıt alınmadı.",
            ephemeral: true
          });
        }

        const isim = content.split("İsim:")[1]?.split("\n")[0]?.trim();
        const ismi = content.split("İsmi:")[1]?.split("\n")[0]?.trim();
        const tagMatch = content.match(/<@&(\d+)>/);

        if (!isim || !ismi || !tagMatch) {
          return interaction.followUp({
            content: "Bilgiler eksik veya hatalı.",
            ephemeral: true
          });
        }

        const ss = msg.attachments.first();

        const embed = new EmbedBuilder()
          .setTitle("Eğitim Log Kaydı")
          .setColor(0x2f3136)
          .addFields(
            { name: "İsim", value: isim, inline: true },
            { name: "İsmi", value: ismi, inline: true },
            { name: "Tag", value: `<@&${tagMatch[1]}>`, inline: false }
          )
          .setImage(ss.url)
          .setTimestamp();

        await logCh.send({ embeds: [embed] });
        await db.add(`egitim.${guildId}.sayac.${isim}`, 1);

        await interaction.followUp({
          content: "Eğitim kaydı başarıyla alındı.",
          ephemeral: true
        });
      });

      collector.on("end", collected => {
        if (collected.size === 0) {
          interaction.followUp({
            content: "Süre doldu, kayıt alınmadı.",
            ephemeral: true
          });
        }
      });
    }
  }
};
