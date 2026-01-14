const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roblox")
    .setDescription("Roblox kontrol sistemi")

    .addSubcommand(sub =>
      sub
        .setName("grup-sorgu")
        .setDescription("Roblox grup kontrolü yapar")
        .addStringOption(opt =>
          opt
            .setName("kullanici")
            .setDescription("Roblox kullanıcı adı")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("kara-liste-ekle")
        .setDescription("Kara listeye ekler")
        .addStringOption(opt =>
          opt
            .setName("kullanici")
            .setDescription("Roblox kullanıcı adı")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("kara-liste-sil")
        .setDescription("Kara listeden siler")
        .addStringOption(opt =>
          opt
            .setName("kullanici")
            .setDescription("Roblox kullanıcı adı")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const isim = interaction.options.getString("kullanici");

    if (sub === "grup-sorgu") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Roblox Grup Sorgu")
            .setDescription(`Kullanıcı: **${isim}**`)
            .setColor(0x2b2d31)
        ]
      });
    }

    if (sub === "kara-liste-ekle") {
      return interaction.reply(`Kara listeye eklendi: ${isim}`);
    }

    if (sub === "kara-liste-sil") {
      return interaction.reply(`Kara listeden silindi: ${isim}`);
    }
  }
};
