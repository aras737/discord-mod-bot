const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  Events,
  MessageFlags 
} = require("discord.js");
const { QuickDB } = require("quick.db");

// Veritabanı örneğini oluştur
const db = new QuickDB();

// Dosyayı bir fonksiyon olarak dışa aktar
module.exports = (client) => {

  // 📌 Slash Komutu
  const commandData = new SlashCommandBuilder()
    .setName("yetki")
    .setDescription("Komutlara özel rol yetkisi ayarlarsın")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName("ekle")
        .setDescription("Bir komut için gerekli rolü ayarla")
        .addStringOption(opt =>
          opt.setName("komut")
            .setDescription("Hangi komuta yetki ayarlanacak?")
            .setRequired(true))
        .addRoleOption(opt =>
          opt.setName("rol")
            .setDescription("En az hangi rol bu komutu kullanabilir?")
            .setRequired(true)
        )
    );

  // Komutun yüklenmesi
  client.once(Events.ClientReady, async () => {
    await client.application.commands.create(commandData);
    console.log("✅ /yetki komutu yüklendi.");
  });

  // 📌 Event – Slash Command ve Kontrol
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    // Sadece /yetki komutunu dinle
    if (interaction.commandName !== 'yetki') return;

    const komut = interaction.commandName;

    // 🔒 Yetki kontrol sistemi
    const requiredRoleId = await db.get(`yetki_${komut}`);
    if (requiredRoleId) {
      const requiredRole = interaction.guild.roles.cache.get(requiredRoleId);
      if (!requiredRole) {
        return interaction.reply({ content: "❌ Bu komut için ayarlanan rol bulunamadı.", flags: MessageFlags.Ephemeral });
      }

      const memberHighest = interaction.member.roles.highest.position;
      if (memberHighest < requiredRole.position) {
        return interaction.reply({ content: `❌ Bu komutu kullanmak için en az **${requiredRole.name}** rolüne sahip olmalısın.`, flags: MessageFlags.Ephemeral });
      }
    }

    // 📌 /yetki komutu çalıştırma
    const sub = interaction.options.getSubcommand();
    if (sub === "ekle") {
      const targetCommand = interaction.options.getString("komut");
      const role = interaction.options.getRole("rol");

      await db.set(`yetki_${targetCommand}`, role.id);
      return interaction.reply({ content: `✅ \`${targetCommand}\` komutu için en az **${role.name}** rolü ayarlandı.`, flags: MessageFlags.Ephemeral });
    }
  });
};
