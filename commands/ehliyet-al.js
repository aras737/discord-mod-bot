const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-al")
    .setDescription("Birinin ehliyetini elinden al (sadece yetkililer).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName("kullanici")
        .setDescription("Ehliyeti alınacak kişi")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanici");
    const ehliyet = db.get(`ehliyet_${user.id}`);

    if (!ehliyet) {
      return interaction.reply({ 
        content: "📛 Bu kişinin zaten ehliyeti yok.", 
        ephemeral: true 
      });
    }

    db.delete(`ehliyet_${user.id}`);
    await interaction.reply(`🚫 ${user} kullanıcısının ehliyeti iptal edildi!`);
  }
};
