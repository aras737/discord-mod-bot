const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  Client, 
  GatewayIntentBits, 
  Events,
  MessageFlags 
} = require("discord.js");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// 📌 Slash Komutları
const yetkiKomutu = new SlashCommandBuilder()
  .setName("yetki")
  .setDescription("Komutlara özel rol yetkisi ayarlar.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand(sub =>
    sub.setName("ekle")
      .setDescription("Bir komut için gerekli rolü ayarlar.")
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

const commands = [yetkiKomutu];

// 📌 Bot Giriş Yaptı Olayı
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);
  await client.application.commands.set(commands);
  console.log("✅ Tüm komutlar yüklendi.");
});

// 📌 Etkileşim (Interaction) Olayı
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member } = interaction;

  // 🔒 Dinamik Rol Yetki Kontrolü
  // Eğer veritabanında komut için bir yetki rolü tanımlıysa bu kontrol çalışır.
  const requiredRoleId = await db.get(`yetki_${commandName}`);
  if (requiredRoleId) {
    const requiredRole = interaction.guild.roles.cache.get(requiredRoleId);
    if (requiredRole) { // Rol mevcutsa kontrol et
      const memberRolePosition = interaction.member.roles.highest.position;
      const requiredRolePosition = requiredRole.position;

      if (memberRolePosition < requiredRolePosition) {
        return interaction.reply({ 
          content: `❌ Bu komutu kullanmak için en az **${requiredRole.name}** rolüne sahip olmalısın.`, 
          flags: MessageFlags.Ephemeral 
        });
      }
    }
  }

  // 🔒 `/yetki` Komutu İçin Standart Yetki Kontrolü
  if (commandName === "yetki") {
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ 
          content: "❌ Bu komutu kullanmak için `Rolleri Yönet` yetkisine sahip olmalısın.", 
          flags: MessageFlags.Ephemeral 
        });
    }
  }

  // 📌 Bot ve Kullanıcı Rol Pozisyonu Kontrolü
  if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
    if (commandName !== 'yetki') {
      return interaction.reply({ 
        content: "❌ Bu işlemi benden daha yetkili bir kullanıcı üzerinde yapamam.", 
        flags: MessageFlags.Ephemeral 
      });
    }
  }

  // 📌 /yetki komutu çalıştırma
  if (commandName === "yetki") {
    const sub = options.getSubcommand();
    if (sub === "ekle") {
      const targetCommand = options.getString("komut");
      const role = options.getRole("rol");

      await db.set(`yetki_${targetCommand}`, role.id);
      return interaction.reply({ 
        content: `✅ \`${targetCommand}\` komutu için en az **${role.name}** rolü ayarlandı.`, 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
});

// 📌 Botu çalıştır
client.login(process.env.TOKEN);
