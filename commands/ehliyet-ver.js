const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Belirtilen kişiye ehliyet ver.")
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Ehliyet verilecek kullanıcı")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanıcı");

    db.set(`ehliyet_${user.id}`, { durum: "Var", tarih: new Date().toLocaleString("tr-TR") });

    return interaction.reply(`✅ ${user} kullanıcısına ehliyet verildi!`);
  }
};
