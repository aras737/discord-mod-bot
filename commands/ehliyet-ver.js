const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Bir kullanıcıya ehliyet ver (sadece yetkililer).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName("kullanici")
        .setDescription("Ehliyet verilecek kişi")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanici");

    if (db.get(`ehliyet_${user.id}`)) {
      return interaction.reply({ 
        content: "❌ Bu kişinin zaten ehliyeti var.", 
        ephemeral: true 
      });
    }

    db.set(`ehliyet_${user.id}`, { 
      durum: "Aktif", 
      tarih: new Date().toLocaleDateString("tr-TR") 
    });

    await interaction.reply(`✅ ${user} kullanıcısına ehliyet verildi!`);
  }
};
