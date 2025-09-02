const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rol-setup")
    .setDescription("Otomatik olarak Üye, Moderatör, Admin ve Kurucu rollerini oluşturur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({ content: "❌ Bu komut yalnızca bir sunucuda kullanılabilir.", ephemeral: true });
    }

    // Rol tanımları (alttan üste doğru)
    const roles = [
      { name: "Üye", color: "Grey", permissions: [] },
      { name: "Moderatör", color: "Blue", permissions: [PermissionFlagsBits.KickMembers, PermissionFlagsBits.ManageMessages] },
      { name: "Admin", color: "Red", permissions: [PermissionFlagsBits.BanMembers, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles] },
      { name: "Kurucu", color: "Gold", permissions: [PermissionFlagsBits.Administrator] },
    ];

    let createdRoles = [];

    for (const roleData of roles) {
      let role = guild.roles.cache.find(r => r.name === roleData.name);
      if (!role) {
        role = await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          permissions: roleData.permissions,
          reason: "Otomatik rol kurulumu"
        });
        createdRoles.push(role.name);
      } else {
        createdRoles.push(`${role.name} (zaten vardı)`);
      }
    }

    // Rolleri sıralama (Kurucu en üstte, Üye en altta)
    const sorted = roles.reverse().map(r => guild.roles.cache.find(role => role.name === r.name));
    await guild.roles.setPosition(sorted[0], guild.roles.highest.position + 1);

    await interaction.reply({
      content: `✅ Roller oluşturuldu / güncellendi:\n${createdRoles.map(r => `• ${r}`).join("\n")}`,
      ephemeral: true
    });
  }
};
