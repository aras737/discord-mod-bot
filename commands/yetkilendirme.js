const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rol-yetki")
    .setDescription("Rol yetki seviyesi sistemi")

    .addSubcommand(s =>
      s.setName("ver")
        .setDescription("Role yetki seviyesi ver")
        .addRoleOption(o =>
          o.setName("rol").setDescription("Rol").setRequired(true)
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
        .setDescription("Rol yetkisini kaldır")
        .addRoleOption(o =>
          o.setName("rol").setDescription("Rol").setRequired(true)
        )
    )

    .addSubcommand(s =>
      s.setName("liste")
        .setDescription("Yetkili roller listesi")
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
      return interaction.editReply("Bu işlemi yapamazsın.");

    if (sub === "ver") {
      const role = interaction.options.getRole("rol");
      const level = interaction.options.getInteger("seviye");
      await db.set(`yetki.rol.${guildId}.${role.id}`, level);

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor("Green")
          .setTitle("Rol Yetkisi Verildi")
          .setDescription(`${role} → Seviye **${level}**`)
        ]
      });
    }

    if (sub === "sil") {
      const role = interaction.options.getRole("rol");
      await db.delete(`yetki.rol.${guildId}.${role.id}`);

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor("Red")
          .setTitle("Rol Yetkisi Silindi")
          .setDescription(`${role}`)
        ]
      });
    }

    if (sub === "liste") {
      const data = (await db.all())
        .filter(x => x.id.startsWith(`yetki.rol.${guildId}.`))
        .map(x => `<@&${x.id.split(".").pop()}> → **${x.value}**`);

      if (!data.length) return interaction.editReply("Yetkili rol yok.");

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor("Blue")
          .setTitle("Yetkili Roller")
          .setDescription(data.join("\n"))
        ]
      });
    }
  }
};
