const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  Events 
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Profesyonel duyuru gönderir ve herkesi etiketler")
    .addStringOption(option =>
      option.setName("baslik")
        .setDescription("Duyuru başlığını girin")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("mesaj")
        .setDescription("Duyuru mesaj içeriğini girin")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("oncelik")
        .setDescription("Duyuru öncelik seviyesini seçin")
        .setRequired(false)
        .addChoices(
          { name: "Düşük Öncelik", value: "dusuk" },
          { name: "Orta Öncelik", value: "orta" },
          { name: "Yüksek Öncelik", value: "yuksek" },
          { name: "Kritik", value: "kritik" }
        )
    )
    .addBooleanOption(option =>
      option.setName("herkesi_etiketle")
        .setDescription("Duyuruda herkesi etiketlemek istiyor musunuz?")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const baslik = interaction.options.getString("baslik");
    const mesaj = interaction.options.getString("mesaj");
    const oncelik = interaction.options.getString("oncelik") || "orta";
    const herkesiEtiketle = interaction.options.getBoolean("herkesi_etiketle") ?? true;

    const oncelikYapisi = {
      dusuk: { renk: "#95a5a6", etiket: "Düşük Öncelik" },
      orta: { renk: "#f39c12", etiket: "Orta Öncelik" },
      yuksek: { renk: "#e74c3c", etiket: "Yüksek Öncelik" },
      kritik: { renk: "#8b0000", etiket: "Kritik Uyarı" }
    };

    const yapilandirma = oncelikYapisi[oncelik];

    const duyuruEmbed = new EmbedBuilder()
      .setTitle(baslik)
      .setDescription(mesaj)
      .setColor(yapilandirma.renk)
      .addFields(
        { name: "Öncelik", value: yapilandirma.etiket, inline: true },
        { name: "Duyuran", value: interaction.user.tag, inline: true },
        { name: "Okudum", value: "0 kişi", inline: true },
        { name: "Önemli", value: "0 kişi", inline: true }
      )
      .setTimestamp();

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

    let yanitIcerigi = herkesiEtiketle ? "@everyone\n\n**Yeni Duyuru**" : "**Yeni Duyuru**";

    const mesajGonder = await interaction.reply({
      content: yanitIcerigi,
      embeds: [duyuruEmbed],
      components: [eylemSatiri],
      fetchReply: true
    });

    // 📌 DB kaydı
    await db.set(`duyuru_${mesajGonder.id}`, {
      okudum: [],
      onemli: []
    });

    // 📌 Eventleri burada dinle
    client.on(Events.InteractionCreate, async butonInteraction => {
      if (!butonInteraction.isButton()) return;

      const [eylem] = butonInteraction.customId.split("_");
      const kayit = await db.get(`duyuru_${butonInteraction.message.id}`);
      if (!kayit) return;

      if (eylem === "okudum") {
        if (!kayit.okudum.includes(butonInteraction.user.id)) {
          kayit.okudum.push(butonInteraction.user.id);
          await db.set(`duyuru_${butonInteraction.message.id}`, kayit);
        }
        await butonInteraction.reply({ content: "Bu duyuruyu okudunuz.", ephemeral: true });
      }

      if (eylem === "onemli") {
        if (!kayit.onemli.includes(butonInteraction.user.id)) {
          kayit.onemli.push(butonInteraction.user.id);
          await db.set(`duyuru_${butonInteraction.message.id}`, kayit);
        }
        await butonInteraction.reply({ content: "Bu duyuruyu önemli olarak işaretlediniz.", ephemeral: true });
      }

      if (eylem === "paylas") {
        await butonInteraction.reply({
          content: `Duyuru bağlantısı: https://discord.com/channels/${butonInteraction.guildId}/${butonInteraction.channelId}/${butonInteraction.message.id}`,
          ephemeral: true
        });
      }

      // 📌 Embed güncelle
      const embed = EmbedBuilder.from(butonInteraction.message.embeds[0])
        .spliceFields(2, 2,
          { name: "Okudum", value: `${kayit.okudum.length} kişi`, inline: true },
          { name: "Önemli", value: `${kayit.onemli.length} kişi`, inline: true }
        );

      await butonInteraction.message.edit({ embeds: [embed] });
    });
  }
};
