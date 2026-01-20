const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Eğitimi girebilecek rol
const AUTH_ROLE_ID = "1439617684638666817";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("egitim")
    .setDescription("Eğitim kayıt sistemi")

    // 🔧 KANAL AYARLAMA
    .addSubcommand(sub =>
      sub
        .setName("kanal")
        .setDescription("Eğitim log kanalını ayarla")
        .addChannelOption(opt =>
          opt
            .setName("kanal")
            .setDescription("Log kanalı")
            .setRequired(true)
        )
    )

    // 📊 LİSTE
    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Bir eğitmenin toplam eğitim sayısını gösterir")
        .addStringOption(opt =>
          opt
            .setName("isim")
            .setDescription("Eğitmen adı")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    /* ===== YETKİ KONTROL ===== */
    if (!interaction.member.roles.cache.has(AUTH_ROLE_ID)) {
      return interaction.editReply("Bu komutu kullanmak için yetkin yok.");
    }

    /* ===== KANAL AYARLA ===== */
    if (sub === "kanal") {
      const kanal = interaction.options.getChannel("kanal");
      await db.set(`egitim.${guildId}.kanal`, kanal.id);

      return interaction.editReply(
        `Eğitim log kanalı ayarlandı: ${kanal}`
      );
    }

    /* ===== LİSTE ===== */
    if (sub === "liste") {
      const isim = interaction.options.getString("isim");
      const count =
        (await db.get(`egitim.${guildId}.sayac.${isim}`)) || 0;

      const embed = new EmbedBuilder()
        .setTitle("Eğitim Kayıt Sayısı")
        .setDescription(
          `**${isim}** tarafından verilen toplam eğitim sayısı:\n\n**${count}**`
        )
        .setColor(0x2f3136)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
