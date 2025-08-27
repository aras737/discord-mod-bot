const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Bir kullanıcıya dijital ehliyet verir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName("kullanici")
        .setDescription("Ehliyet verilecek kullanıcı")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("roblox-ismi")
        .setDescription("Kullanıcının Roblox ismi")
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("kullanici");
    const robloxName = interaction.options.getString("roblox-ismi");

    // DB'ye kaydet
    db.set(`ehliyet_${target.id}`, {
      durum: "Var",
      veren: interaction.user.id,
      roblox: robloxName,
      discord: target.tag,
      tarih: Date.now()
    });

    // Tarih formatı
    const date = new Date();
    const tarihStr = date.toLocaleString("tr-TR", { 
      day: "2-digit", month: "2-digit", year: "numeric", 
      hour: "2-digit", minute: "2-digit", second: "2-digit" 
    });

    // Embed
    const embed = new EmbedBuilder()
      .setColor("#00ff80")
      .setAuthor({
        name: "🚗 Dijital Ehliyet",
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "👤 Roblox İsmi", value: `${robloxName}`, inline: false },
        { name: "📌 Durum", value: `Var`, inline: false },
        { name: "📅 Veriliş Tarihi", value: `${tarihStr}`, inline: false }
      )
      .setFooter({
        text: `Resmî Dijital Ehliyet | bugün saat ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`,
        iconURL: interaction.client.user.displayAvatarURL()
      });

    await interaction.reply({ embeds: [embed] });
  }
};
