const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Eğitim log ve kayıt sistemi")
    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Bir eğitmenin kaç eğitim verdiğini gösterir")
        .addStringOption(opt =>
          opt.setName("isim")
            .setDescription("Eğitmen adı")
            .setRequired(true)
        )
    )
    .addChannelOption(opt =>
      opt.setName("logs")
        .setDescription("Log kanalı (ilk kurulum)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;

    /* LOG KANALI AYARI */
    const logChannel = interaction.options.getChannel("logs");
    if (logChannel) {
      await db.set(`egitim.${guildId}.kanal`, logChannel.id);
    }

    const logChannelId = await db.get(`egitim.${guildId}.kanal`);
    if (!logChannelId) {
      return interaction.editReply(
        "Log kanalı ayarlı değil. Komutu logs seçeneği ile tekrar kullanın."
      );
    }

    const logCh = interaction.guild.channels.cache.get(logChannelId);
    if (!logCh) {
      return interaction.editReply("Log kanalı bulunamadı.");
    }

    /* -------- LİSTE -------- */
    if (interaction.options.getSubcommand() === "liste") {
      const isim = interaction.options.getString("isim");
      const count = await db.get(`egitim.${guildId}.sayac.${isim}`) || 0;

      const embed = new EmbedBuilder()
        .setTitle("Eğitim Sayacı")
        .setDescription(
          `${isim} tarafından verilen toplam eğitim sayısı: ${count}`
        )
        .setColor(0x2f3136)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    /* -------- KAYIT -------- */
    await interaction.editReply(
      "Lütfen aşağıdaki formatta mesaj gönderin ve SS ekleyin."
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
          { name: "İsim", value: isim },
          { name: "İsmi", value: ismi },
          { name: "Tag", value: `<@&${tagMatch[1]}>` }
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
};
