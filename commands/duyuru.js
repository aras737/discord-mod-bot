const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const BRANSLAR = [
  { name: "Jandarma", value: "jandarma" },
  { name: "Askeri İnzibat", value: "inzibat" },
  { name: "Özel Kuvvetler", value: "ozelkuvvetler" },
  { name: "Hava Kuvvetleri", value: "havakuvvetleri" },
  { name: "Kara Kuvvetleri", value: "karakuvvetleri" },
  { name: "Sınır Müfettişleri", value: "sinirmufettisleri" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("karaliste")
    .setDescription("Branşlara özel kara liste sistemi")

    // YETKİ AYARLAMA
    .addSubcommand(sub =>
      sub.setName("yetki")
        .setDescription("Branş kara liste yetkilisini ayarla")
        .addStringOption(o =>
          o.setName("brans")
            .setDescription("Branş")
            .setRequired(true)
            .addChoices(...BRANSLAR)
        )
        .addRoleOption(o =>
          o.setName("rol")
            .setDescription("Kara Liste Yetkilisi")
            .setRequired(true)
        )
    )

    // EKLE
    .addSubcommand(sub =>
      sub.setName("ekle")
        .setDescription("Kara listeye ekle")
        .addStringOption(o =>
          o.setName("brans").setDescription("Branş").setRequired(true).addChoices(...BRANSLAR)
        )
        .addStringOption(o =>
          o.setName("isim").setDescription("Kişi adı").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("sebep").setDescription("Sebep").setRequired(true)
        )
    )

    // SİL
    .addSubcommand(sub =>
      sub.setName("sil")
        .setDescription("Kara listeden çıkar")
        .addStringOption(o =>
          o.setName("brans").setDescription("Branş").setRequired(true).addChoices(...BRANSLAR)
        )
        .addStringOption(o =>
          o.setName("isim").setDescription("Kişi adı").setRequired(true)
        )
    )

    // LİSTE
    .addSubcommand(sub =>
      sub.setName("liste")
        .setDescription("Branş kara liste")
        .addStringOption(o =>
          o.setName("brans").setDescription("Branş").setRequired(true).addChoices(...BRANSLAR)
        )
    )

    // SORGU
    .addSubcommand(sub =>
      sub.setName("sorgu")
        .setDescription("Kişi kara listede mi?")
        .addStringOption(o =>
          o.setName("isim").setDescription("Kişi adı").setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const brans = interaction.options.getString("brans");

    /* ================= YETKİ ================= */
    if (sub === "yetki") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "Yetkiniz yok.", ephemeral: true });
      }

      const rol = interaction.options.getRole("rol");
      await client.db.set(`karaliste.yetkili.${brans}`, rol.id);

      const embed = new EmbedBuilder()
        .setTitle("Kara Liste Yetki Ayarı")
        .setDescription(
          `**Branş:** ${brans}\n**Yetkili Rol:** <@&${rol.id}>`
        )
        .setColor(0x2f3136);

      return interaction.reply({ embeds: [embed] });
    }

    /* ================= YETKİ KONTROL ================= */
    const yetkiliRol = await client.db.get(`karaliste.yetkili.${brans}`);
    if (!yetkiliRol || !interaction.member.roles.cache.has(yetkiliRol)) {
      return interaction.reply({
        content: "Bu işlem için kara liste yetkin yok.",
        ephemeral: true
      });
    }

    /* ================= EKLE ================= */
    if (sub === "ekle") {
      const isim = interaction.options.getString("isim");
      const sebep = interaction.options.getString("sebep");

      await client.db.set(`karaliste.${brans}.${isim}`, {
        sebep,
        yetkili: interaction.user.id,
        tarih: Date.now()
      });

      const embed = new EmbedBuilder()
        .setTitle("Kara Liste Kaydı")
        .addFields(
          { name: "Branş", value: brans, inline: true },
          { name: "İsim", value: isim, inline: true },
          { name: "Sebep", value: sebep }
        )
        .setColor(0x8b0000)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    /* ================= SİL ================= */
    if (sub === "sil") {
      const isim = interaction.options.getString("isim");
      await client.db.delete(`karaliste.${brans}.${isim}`);

      const embed = new EmbedBuilder()
        .setTitle("Kara Liste Güncellemesi")
        .setDescription(`${isim} kara listeden çıkarıldı.`)
        .setColor(0x2f3136);

      return interaction.reply({ embeds: [embed] });
    }

    /* ================= LİSTE ================= */
    if (sub === "liste") {
      const data = await client.db.get(`karaliste.${brans}`) || {};
      const liste = Object.keys(data);

      const embed = new EmbedBuilder()
        .setTitle(`${brans} Kara Liste`)
        .setDescription(
          liste.length ? liste.join("\n") : "Kayıt bulunamadı."
        )
        .setColor(0x2f3136);

      return interaction.reply({ embeds: [embed] });
    }

    /* ================= SORGU ================= */
    if (sub === "sorgu") {
      const isim = interaction.options.getString("isim");
      let bulundu = null;

      for (const b of BRANSLAR) {
        const kayıt = await client.db.get(`karaliste.${b.value}.${isim}`);
        if (kayıt) {
          bulundu = b.name;
          break;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Kara Liste Sorgu")
        .setDescription(
          bulundu
            ? `${isim} **${bulundu}** kara listesinde kayıtlı.`
            : `${isim} kara listede bulunamadı.`
        )
        .setColor(0x2f3136);

      return interaction.reply({ embeds: [embed] });
    }
  }
};
