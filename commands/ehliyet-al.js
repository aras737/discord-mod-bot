const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ehliyet-al")
    .setDescription("Bir kişinin ehliyetini elinden alır.")
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Ehliyeti alınacak kişi")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser("kullanıcı");

    const ehliyet = await db.get(`ehliyet_${user.id}`);
    if (!ehliyet) {
      return interaction.reply({ content: `❌ ${user} kullanıcısının ehliyeti zaten yok.`, flags: 64 });
    }

    await db.delete(`ehliyet_${user.id}`);
    return interaction.reply(`🚫 ${user} kullanıcısının ehliyeti elinden alındı!`);
  }
};
