üconst {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("globalunban")
    .setDescription("Global banı kaldırır")
    .addStringOption(opt =>
      opt.setName("kullanici_id")
        .setDescription("Banı kaldırılacak ID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const userId = interaction.options.getString("kullanici_id");

    const data = await client.db.get(`globalban.${userId}`);
    if (!data) {
      return interaction.reply({ content: "❌ Bu kullanıcı global banlı değil.", ephemeral: true });
    }

    await client.db.delete(`globalban.${userId}`);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("GLOBAL UNBAN")
      .addFields(
        { name: "Kullanıcı ID", value: userId },
        { name: "Yetkili", value: interaction.user.tag }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
