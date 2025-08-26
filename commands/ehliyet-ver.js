const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-ver")
    .setDescription("Belirtilen kişiye ehliyet ver.")
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Ehliyet verilecek Discord kullanıcısı")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("roblox")
        .setDescription("Kullanıcının Roblox ismi")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanıcı");
    const robloxName = interaction.options.getString("roblox");

    await db.set(`ehliyet_${user.id}`, { 
      durum: "Var", 
      tarih: new Date().toLocaleString("tr-TR"),
      roblox: robloxName
    });

    return interaction.reply(`✅ ${user} kullanıcısına Roblox hesabı **${robloxName}** ile ehliyet verildi!`);
  }
};
