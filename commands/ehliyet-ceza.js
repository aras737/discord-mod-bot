const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ceza")
    .setDescription("Bir kullanıcıya ehliyet cezası ver ve BL yap.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Ehliyet cezası verilecek kullanıcı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanıcı");
    const ehliyet = db.get(`ehliyet_${user.id}`);

    if (!ehliyet) return interaction.reply("❌ Bu kişinin ehliyeti yok!");

    db.set(`ehliyet_${user.id}`, { durum: "BL (Cezalı)", ceza: ehliyet.ceza + 1 });
    await interaction.reply(`⚠️ ${user} ehliyet cezası aldı! Ehliyet durumu: **BL**`);
  }
};
