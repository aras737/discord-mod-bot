const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Bir kullanıcıya ehliyet ver.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Ehliyet verilecek kullanıcı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanıcı");

    db.set(`ehliyet_${user.id}`, { durum: "Aktif", ceza: 0 });
    await interaction.reply(`✅ ${user} kullanıcısına ehliyet verildi!`);
  }
};
