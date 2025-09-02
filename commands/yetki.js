const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  Client, 
  GatewayIntentBits, 
  Events 
} = require("discord.js");
const { QuickDB } = require("quick.db");

// Veritabanı örneğini oluştur
const db = new QuickDB();

// 📌 Slash Komutu
const commandData = new SlashCommandBuilder()
  .setName("yetki")
  .setDescription("Komutlara özel rol yetkisi ayarlarsın")
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

// 📌 Event – Slash Command ve Kontrol
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const komut = interaction.commandName;

  // 🔒 Yetki kontrol sistemi
  const requiredRoleId = await db.get(`yetki_${komut}`);
  if (requiredRoleId) {
    const requiredRole = interaction.guild.roles.cache.get(requiredRoleId);
    if (!requiredRole) {
      return interaction.reply({ content: "❌ Bu komut için ayarlanan rol bulunamadı.", ephemeral: true });
    }

    const memberHighest = interaction.member.roles.highest.position;
    if (memberHighest < requiredRole.position) {
      return interaction.reply({ content: `❌ Bu komutu kullanmak için en az **${requiredRole.name}** rolüne sahip olmalısın.`, ephemeral: true });
    }
  }

  // 📌 /yetki komutu çalıştırma
  if (komut === "yetki") {
    // Sadece sunucu yetkililerinin bu komutu kullanabilmesi için kontrol
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ content: "❌ Bu komutu kullanmak için `Rolleri Yönet` yetkin olmalı.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    if (sub === "ekle") {
      const targetCommand = interaction.options.getString("komut");
      const role = interaction.options.getRole("rol");

      await db.set(`yetki_${targetCommand}`, role.id);
      return interaction.reply({ content: `✅ \`${targetCommand}\` komutu için en az **${role.name}** rolü ayarlandı.`, ephemeral: true });
    }
  }
});
