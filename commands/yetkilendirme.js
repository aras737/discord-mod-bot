const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yetki")
    .setDescription("Bir komutu belirli bir rol ve üstüne tanımlar.")
    .addRoleOption(option =>
      option.setName("rol")
        .setDescription("Yetki verilecek rol")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("komut")
        .setDescription("Yetki verilecek komut (ör: ban, kick, mute)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const rol = interaction.options.getRole("rol");
    const komut = interaction.options.getString("komut").toLowerCase();

    // 📌 Rolü o komuta kaydet
    await db.set(`yetki_${komut}`, rol.id);

    await interaction.reply({
      content: `✅ ${komut} komutunu kullanmak için gerekli rol **${rol.name}** ve üstü olarak ayarlandı.`,
      ephemeral: true
    });
  },

  // 📌 Event kontrol (komut kendi içinde)
  async checkPermission(interaction) {
    const requiredRoleId = await db.get(`yetki_${interaction.commandName}`);
    if (!requiredRoleId) return true; // Ayarlanmamışsa serbest

    const member = interaction.member;
    const guildRoles = interaction.guild.roles.cache;

    const requiredRole = guildRoles.get(requiredRoleId);
    if (!requiredRole) return true; // Rol silinmişse serbest

    // Kullanıcının rolünü kontrol et
    const hasPermission = member.roles.cache.some(r => r.position >= requiredRole.position);

    if (!hasPermission) {
      await interaction.reply({
        content: `⛔ Bu komutu kullanabilmek için **${requiredRole.name}** veya üstü olmalısın.`,
        ephemeral: true
      });
      return false;
    }

    return true;
  }
};
