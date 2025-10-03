const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle, 
  PermissionFlagsBits 
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Profesyonel bir duyuru gönderir.")
    .addStringOption(option =>
      option.setName("baslik")
        .setDescription("Duyuru başlığını yazınız")
        .setRequired(true)
        .setMaxLength(256)
    )
    .addStringOption(option =>
      option.setName("mesaj")
        .setDescription("Duyuru mesajını yazınız")
        .setRequired(true)
        .setMaxLength(4000)
    )
    .addBooleanOption(option =>
      option.setName("herkesi_etiketle")
        .setDescription("Bu duyuruda herkesi etiketlemek ister misiniz?")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const baslik = interaction.options.getString("baslik");
    const mesaj = interaction.options.getString("mesaj");
    const herkesiEtiketle = interaction.options.getBoolean("herkesi_etiketle") ?? false;

    // Embed
    const duyuruEmbed = new EmbedBuilder()
      .setTitle(baslik)
      .setDescription(mesaj)
      .setColor("#3498db")
      .addFields(
        { name: "Duyuruyu Yapan", value: interaction.user.tag, inline: true },
        { name: "Sunucu", value: interaction.guild.name, inline: true }
      )
      .setTimestamp()
      .setFooter({
        text: `Duyuru Kimliği: ${interaction.id}`,
        iconURL: interaction.guild.iconURL()
      });

    // Butonlar
    const okuduButonu = new ButtonBuilder()
      .setCustomId(`okudum_${interaction.id}`)
      .setLabel("Okudum")
      .setStyle(ButtonStyle.Success);

    const onemliButonu = new ButtonBuilder()
      .setCustomId(`onemli_${interaction.id}`)
      .setLabel("Önemli")
      .setStyle(ButtonStyle.Primary);

    const paylasButonu = new ButtonBuilder()
      .setCustomId(`paylas_${interaction.id}`)
      .setLabel("Paylaş")
      .setStyle(ButtonStyle.Secondary);

    const eylemSatiri = new ActionRowBuilder()
      .addComponents(okuduButonu, onemliButonu, paylasButonu);

    // Yanıt
    let yanitIcerigi = "**Yeni Sunucu Duyurusu**";
    if (herkesiEtiketle) yanitIcerigi = "@everyone\n\n" + yanitIcerigi;

    await interaction.reply({
      content: yanitIcerigi,
      embeds: [duyuruEmbed],
      components: [eylemSatiri]
    });

    console.log(`${interaction.user.tag} duyuru gönderdi: ${baslik}`);
  },

  async butonEtkilesiminiYonet(interaction) {
    if (!interaction.isButton()) return;

    const [eylem] = interaction.customId.split("_");

    switch (eylem) {
      case "okudum":
        return interaction.reply({
          content: "Bu duyuruyu okudunuz olarak işaretlediniz.",
          ephemeral: true
        });
      case "onemli":
        return interaction.reply({
          content: "Bu duyuruyu önemli olarak işaretlediniz.",
          ephemeral: true
        });
      case "paylas":
        return interaction.reply({
          content: `Bu duyuruyu bağlantı üzerinden paylaşabilirsiniz:\nhttps://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.id}`,
          ephemeral: true
        });
      default:
        return interaction.reply({
          content: "Bilinmeyen işlem.",
          ephemeral: true
        });
    }
  }
};
