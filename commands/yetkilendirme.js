const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yetki")
    .setDescription("Rol ve komut yetki sistemi")

    /* -------- ROL YETKİ -------- */
    .addSubcommand(sub =>
      sub
        .setName("rol-ver")
        .setDescription("Bir role yetki seviyesi ver")
        .addRoleOption(opt =>
          opt.setName("rol")
            .setDescription("Yetki verilecek rol")
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName("seviye")
            .setDescription("Yetki seviyesi (1-5)")
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("rol-sil")
        .setDescription("Rolden yetkiyi kaldır")
        .addRoleOption(opt =>
          opt.setName("rol")
            .setDescription("Yetkisi silinecek rol")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("rol-liste")
        .setDescription("Yetkili roller listesini göster")
    )

    /* -------- KOMUT YETKİ -------- */
    .addSubcommand(sub =>
      sub
        .setName("komut-ayarla")
        .setDescription("Bir komuta yetki seviyesi ver")
        .addStringOption(opt =>
          opt.setName("komut")
            .setDescription("Komut adı (ban, kick vb.)")
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName("seviye")
            .setDescription("Gerekli seviye (1-5)")
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("komut-sil")
        .setDescription("Komut yetkisini kaldır")
        .addStringOption(opt =>
          opt.setName("komut")
            .setDescription("Komut adı")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("komut-liste")
        .setDescription("Komut yetkilerini listele")
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    /* ===== KULLANICI SEVİYESİ ===== */
    let userLevel = 0;
    for (const role of interaction.member.roles.cache.values()) {
      const lvl = await db.get(`yetki.rol.${guildId}.${role.id}`);
      if (lvl && lvl > userLevel) userLevel = lvl;
    }

    if (
      userLevel < 5 &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.editReply("Bu sistemi kullanmak için yetkin yok.");
    }

    /* ===== ROL VER ===== */
    if (sub === "rol-ver") {
      const role = interaction.options.getRole("rol");
      const level = interaction.options.getInteger("seviye");

      await db.set(`yetki.rol.${guildId}.${role.id}`, level);

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("Rol Yetkisi Verildi")
            .setDescription(`${role} → Seviye **${level}**`)
        ]
      });
    }

    /* ===== ROL SİL ===== */
    if (sub === "rol-sil") {
      const role = interaction.options.getRole("rol");

      await db.delete(`yetki.rol.${guildId}.${role.id}`);

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("Rol Yetkisi Kaldırıldı")
            .setDescription(`${role}`)
        ]
      });
    }

    /* ===== ROL LİSTE ===== */
    if (sub === "rol-liste") {
      const data = (await db.all())
        .filter(x => x.id.startsWith(`yetki.rol.${guildId}.`))
        .map(x => {
          const id = x.id.split(".").pop();
          return `<@&${id}> → Seviye **${x.value}**`;
        });

      if (!data.length)
        return interaction.editReply("Yetkili rol yok.");

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTitle("Yetkili Roller")
            .setDescription(data.join("\n"))
        ]
      });
    }

    /* ===== KOMUT AYARLA ===== */
    if (sub === "komut-ayarla") {
      const cmd = interaction.options.getString("komut");
      const level = interaction.options.getInteger("seviye");

      await db.set(`yetki.komut.${guildId}.${cmd}`, level);

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("Komut Yetkisi Ayarlandı")
            .setDescription(`/${cmd} → Seviye **${level}**`)
        ]
      });
    }

    /* ===== KOMUT SİL ===== */
    if (sub === "komut-sil") {
      const cmd = interaction.options.getString("komut");

      await db.delete(`yetki.komut.${guildId}.${cmd}`);

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("Komut Yetkisi Silindi")
            .setDescription(`/${cmd}`)
        ]
      });
    }

    /* ===== KOMUT LİSTE ===== */
    if (sub === "komut-liste") {
      const data = (await db.all())
        .filter(x => x.id.startsWith(`yetki.komut.${guildId}.`))
        .map(x => {
          const cmd = x.id.split(".").pop();
          return `/${cmd} → Seviye **${x.value}**`;
        });

      if (!data.length)
        return interaction.editReply("Yetkili komut yok.");

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTitle("Komut Yetkileri")
            .setDescription(data.join("\n"))
        ]
      });
    }
  }
};
