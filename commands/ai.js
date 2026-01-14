const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

/* ===== AYARLAR ===== */
const YETKILI_ROL_ID = "253"; // sadece BU rol ve ÜSTÜ
/* =================== */

module.exports = {
  data: new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Eğitim log ve kayıt sistemi")

    .addSubcommand(sub =>
      sub
        .setName("logs")
        .setDescription("Eğitim log kanalını ayarla")
        .addChannelOption(opt =>
          opt
            .setName("kanal")
            .setDescription("Log kanalı")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Bir kişinin verdiği eğitim sayısını gösterir")
        .addStringOption(opt =>
          opt
            .setName("isim")
            .setDescription("Eğitmen adı")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.member;

    /* === ROL YETKİ KONTROL === */
    const hasAuth = member.roles.cache.some(r =>
      BigInt(r.id) >= BigInt(YETKILI_ROL_ID)
    );

    if (!hasAuth) {
      return interaction.editReply(
        "Bu komutu kullanmak için yetkin yok."
      );
    }

    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    /* ===== LOG KANALI AYAR ===== */
    if (sub === "logs") {
      const kanal = interaction.options.getChannel("kanal");
      await db.set(`egitim.${guildId}.kanal`, kanal.id);

      return interaction.editReply(
        `Eğitim log kanalı ayarlandı: ${kanal}`
      );
    }

    const logChannelId = await db.get(`egitim.${guildId}.kanal`);
    if (!logChannelId) {
      return interaction.editReply(
        "Log kanalı ayarlı değil. `/egitim logs` ile ayarla."
      );
    }

    const logChannel =
      interaction.guild.channels.cache.get(logChannelId);

    if (!logChannel) {
      return interaction.editReply("Log kanalı bulunamadı.");
    }

    /* ===== LİSTE ===== */
    if (sub === "liste") {
      const isim = interaction.options.getString("isim");
      const count =
        (await db.get(`egitim.${guildId}.sayac.${isim}`)) || 0;

      const embed = new EmbedBuilder()
        .setTitle("Eğitim Sayacı")
        .setDescription(
          `**${isim}** tarafından verilen toplam eğitim:\n\n**${count}**`
        )
        .setColor(0x2f3136)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    /* ===== KAYIT BİLGİLENDİRME ===== */
    await interaction.editReply(
      "Belirlenen **log kanalına**, **SS ekleyerek** formatta mesaj at."
    );

    /* ===== MESAJ DİNLE ===== */
    const collector = logChannel.createMessageCollector({
      filter: m => m.author.id === interaction.user.id,
      time: 5 * 60 * 1000
    });

    collector.on("collect", async (msg) => {
      if (msg.attachments.size === 0) return;

      const text = msg.content;

      if (
        !text.includes("İsim:") ||
        !text.includes("İsmi:") ||
        !text.includes("SS,Kayıt:") ||
        !text.includes("Tag:")
      ) return;

      const isim =
        text.split("İsim:")[1]?.split("\n")[0]?.trim();
      const ismi =
        text.split("İsmi:")[1]?.split("\n")[0]?.trim();
      const tagMatch = text.match(/<@&(\d+)>/);

      if (!isim || !ismi || !tagMatch) return;

      const ss = msg.attachments.first();

      /* === EMBED LOG === */
      const embed = new EmbedBuilder()
        .setTitle("Eğitim Log Kaydı")
        .addFields(
          { name: "Eğitmen", value: isim },
          { name: "Eğitim Alan", value: ismi },
          { name: "Tag", value: `<@&${tagMatch[1]}>` }
        )
        .setImage(ss.url)
        .setColor(0x2f3136)
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

      await db.add(`egitim.${guildId}.sayac.${isim}`, 1);

      await interaction.followUp({
        content: "Eğitim kaydı alındı.",
        ephemeral: true
      });

      collector.stop();
    });
  }
};
