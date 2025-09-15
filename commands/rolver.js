const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const noblox = require("noblox.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("robloxrol")
    .setDescription("Roblox grubunda bir üyeye rol ver/al")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // sadece admin kullanır
    .addSubcommand(sub =>
      sub.setName("ver")
        .setDescription("Bir Roblox kullanıcısına rol ver")
        .addStringOption(opt => opt.setName("kullanici").setDescription("Roblox kullanıcı adı").setRequired(true))
        .addIntegerOption(opt => opt.setName("rolid").setDescription("Grup içindeki rol ID’si").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("al")
        .setDescription("Bir Roblox kullanıcısından rol al (en düşük role düşür)")
        .addStringOption(opt => opt.setName("kullanici").setDescription("Roblox kullanıcı adı").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const username = interaction.options.getString("kullanici");
    const groupId = 17167324; // senin grubun ID'si
    const roleId = interaction.options.getInteger("rolid");

    try {
      const userId = await noblox.getIdFromUsername(username);

      if (sub === "ver") {
        await noblox.setRank(groupId, userId, roleId);
        return interaction.reply(`✅ **${username}** adlı kullanıcıya grup içinde rol verildi (Role ID: ${roleId}).`);
      }

      if (sub === "al") {
        await noblox.setRank(groupId, userId, 1); // 1 = Guest
        return interaction.reply(`🗑️ **${username}** adlı kullanıcı en düşük role (Guest) düşürüldü.`);
      }

    } catch (err) {
      console.error(err);
      return interaction.reply(`❌ İşlem başarısız oldu: ${err.message}`);
    }
  }
};
