const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("komut-yetki")
    .setDescription("Komut yetki seviyesi sistemi")

    .addSubcommand(s =>
      s.setName("ayarla")
        .setDescription("Komuta seviye ver")
        .addStringOption(o =>
          o.setName("komut").setDescription("Komut adı").setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName("seviye")
            .setDescription("Seviye (1-5)")
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(true)
        )
    )

    .addSubcommand(s =>
      s.setName("sil")
        .setDescription("Komut yetkisini kaldır")
        .addStringOption(o =>
          o.setName("komut").setDescription("Komut adı").setRequired(true)
        )
    )

    .addSubcommand(s =>
      s.setName("liste")
        .setDescription("Komut yetkileri listesi")
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    let userLevel = 0;
    for (const r of interaction.member.roles.cache.values()) {
      const lvl = await db.get(`yetki.rol.${guildId}.${r.id}`);
      if (lvl && lvl > userLevel) userLevel = lvl;
    }

    if (userLevel < 5 && !interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.editReply("Yetkin yok.");

    if (sub === "ayarla") {
      const cmd = interaction.options.getString("komut");
      const lvl = interaction.options.getInteger("seviye");
      await db.set(`yetki.komut.${guildId}.${cmd}`, lvl);

      return interaction.editReply(`/${cmd} için seviye **${lvl}** ayarlandı.`);
    }

    if (sub === "sil") {
      const cmd = interaction.options.getString("komut");
      await db.delete(`yetki.komut.${guildId}.${cmd}`);
      return interaction.editReply(`/${cmd} yetkisi silindi.`);
    }

    if (sub === "liste") {
      const data = (await db.all())
        .filter(x => x.id.startsWith(`yetki.komut.${guildId}.`))
        .map(x => `/${x.id.split(".").pop()} → **${x.value}**`);

      if (!data.length) return interaction.editReply("Yetkili komut yok.");
      return interaction.editReply(data.join("\n"));
    }
  }
};
