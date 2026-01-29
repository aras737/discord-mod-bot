const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildBans
  ]
});

// --- KOMUTLAR ---
const commands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Kullanıcıyı Discord yasaklar sistemine işler")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("kullanici").setDescription("Yasaklanacak üye").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Yasaklama sebebi").setRequired(true)),
  new SlashCommandBuilder()
    .setName("ban-listesi")
    .setDescription("Discord'daki orijinal yasaklılar listesini gösterir")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
].map(c => c.toJSON());

client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Yasaklama Sistemi Aktif!");
  } catch (err) { console.error(err); }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // --- BAN LİSTESİ (Discord'un orijinal sistemini çeker) ---
  if (interaction.commandName === "ban-listesi") {
    // Kimin kullandığı görünmesin diye gizli yanıtla başla
    await interaction.reply({ content: "Liste çekiliyor...", ephemeral: true });

    try {
      const bans = await interaction.guild.bans.fetch();
      
      const embed = new EmbedBuilder()
        .setColor("#ffffff") // Görseldeki beyaz tema
        .setTitle("🔨 Yasaklar") // İstediğin başlık
        .setTimestamp();

      if (bans.size === 0) {
        embed.setDescription("Sunucuda aktif bir yasaklama bulunmuyor.");
      } else {
        // Discord sistemindeki verileri sıralıyoruz
        const list = bans.map(b => `• **${b.user.tag}**\n  └ ID: \`${b.user.id}\`\n  └ Sebep: *${b.reason || "Belirtilmemiş"}*`).join("\n\n");
        embed.setDescription(list.length > 4000 ? list.substring(0, 3950) + "..." : list);
      }

      // Kanala isimsiz gönder
      await interaction.channel.send({ embeds: [embed] });
      // "Kullandı" yazısını yok et
      return interaction.deleteReply();
    } catch {
      return interaction.editReply("❌ Yasaklara erişilemedi.");
    }
  }

  // --- BAN KOMUTU ---
  if (interaction.commandName === "ban") {
    const target = interaction.options.getUser("kullanici");
    const reason = interaction.options.getString("sebep");

    await interaction.reply({ content: "İşlem yapılıyor...", ephemeral: true });

    try {
      await interaction.guild.members.ban(target.id, { reason });

      const successEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(`✅ **${target.tag}** yasaklandı ve sisteme işlendi.\n**Sebep:** ${reason}`)
        .setTimestamp();

      await interaction.channel.send({ embeds: [successEmbed] });
      return interaction.deleteReply();
    } catch {
      return interaction.editReply("❌ Yetkim yetmedi, kullanıcı yasaklanamadı.");
    }
  }
});

client.login(process.env.TOKEN);
