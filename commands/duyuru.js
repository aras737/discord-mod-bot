const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("globalban")
    .setDescription("Kullanıcıyı tüm sunucular için global banlar")
    .addUserOption(opt =>
      opt.setName("hedef")
        .setDescription("Global ban atılacak kullanıcı")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("sebep")
        .setDescription("Ban sebebi")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const user = interaction.options.getUser("hedef");
    const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi";

    const exists = await client.db.get(`globalban.${user.id}`);
    if (exists) {
      return interaction.reply({ content: "❌ Kullanıcı zaten global banlı.", ephemeral: true });
    }

    await client.db.set(`globalban.${user.id}`, {
      userId: user.id,
      moderator: interaction.user.id,
      sebep,
      date: Date.now()
    });

    // DM
    try {
      await user.send(
        `🚫 **GLOBAL BAN**\nTüm bot sunucularından yasaklandın.\nSebep: **${sebep}**`
      );
    } catch {}

    // Bulunduğu sunucudan at
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member) {
      await member.ban({ reason: `GLOBAL BAN | ${sebep}` });
    }

    const embed = new EmbedBuilder()
      .setColor("DarkRed")
      .setTitle("GLOBAL BAN")
      .addFields(
        { name: "Kullanıcı", value: `${user.tag}\n${user.id}` },
        { name: "Sebep", value: sebep },
        { name: "Yetkili", value: interaction.user.tag }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
