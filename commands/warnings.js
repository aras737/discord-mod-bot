const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* ---------------- SLASH KOMUTLAR ---------------- */

const commands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir kullanıcıyı banlar")
    .addUserOption(opt =>
      opt.setName("kullanici")
        .setDescription("Banlanacak kişi")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("sebep")
        .setDescription("Ban sebebi")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Bir kullanıcının banını açar")
    .addStringOption(opt =>
      opt.setName("id")
        .setDescription("Banı açılacak kullanıcı ID")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

/* ---------------- KOMUT YÜKLEME ---------------- */

client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("Slash komutlar yüklendi");
  } catch (e) {
    console.error(e);
  }

  console.log(`Bot aktif: ${client.user.tag}`);
});

/* ---------------- INTERACTION ---------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ban") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
    }

    const user = interaction.options.getUser("kullanici");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi";

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({ content: "Kullanıcı sunucuda değil.", ephemeral: true });
    }

    await member.ban({ reason });

    const embed = new EmbedBuilder()
      .setTitle("Kullanıcı Banlandı")
      .addFields(
        { name: "Kullanıcı", value: `${user.tag}` },
        { name: "Sebep", value: reason }
      )
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "unban") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
    }

    const id = interaction.options.getString("id");

    try {
      await interaction.guild.bans.remove(id);

      const embed = new EmbedBuilder()
        .setTitle("Ban Kaldırıldı")
        .setDescription(`ID: ${id}`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "Ban bulunamadı.", ephemeral: true });
    }
  }
});

/* ---------------- BANLI GİRERSE DM + OTOMATİK BAN ---------------- */

client.on("guildMemberAdd", async member => {
  try {
    const bans = await member.guild.bans.fetch();
    if (!bans.has(member.id)) return;

    try {
      await member.send(
        `Bu sunucuda banlısın.\nBanın kaldırılmadan tekrar katılamazsın.\nSunucu: ${member.guild.name}`
      );
    } catch {}

    await member.ban({
      reason: "Banlı olduğu halde sunucuya girmeye çalıştı"
    });
  } catch (err) {
    console.error("Oto-ban hatası:", err);
  }
});

client.login(TOKEN);
