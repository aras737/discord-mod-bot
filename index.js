const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { 
  Client, 
  Collection, 
  GatewayIntentBits, 
  Partials, 
  Events, 
  REST, 
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

// 📌 Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const commands = [];

// 📂 commands klasöründen komutları yükle
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: ${command.data.name}`);
  } else {
    console.log(`⚠️ Komut eksik: ${file}`);
  }
}

// ✅ Slash komutlarını Discord'a kaydet
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log("✅ Slash komutları başarıyla yüklendi.");
  } catch (err) {
    console.error(err);
  }
});

// 🎯 Slash komutlar & buton eventleri
client.on(Events.InteractionCreate, async interaction => {
  // Slash komutlar
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "❌ Bir hata oluştu!", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Bir hata oluştu!", ephemeral: true });
      }
    }
  }

  // 🎟️ Ticket açma
  if (interaction.isButton() && interaction.customId === "create_ticket") {
    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({ content: `❌ Zaten açık biletin var: ${existing}`, ephemeral: true });
    }

    // Manager rolünü bul veya oluştur
    let managerRole = interaction.guild.roles.cache.find(r => r.name === "Manager");
    if (!managerRole) {
      managerRole = await interaction.guild.roles.create({
        name: "Manager",
        color: "Red",
        permissions: ["Administrator"],
      });
      console.log("✅ Manager rolü oluşturuldu.");
    }

    // Kullanıcıya Manager rolünü ver
    await interaction.member.roles.add(managerRole);

    // Ticket kanalı oluştur
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
      ],
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Kapat")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `🎟️ Merhaba ${interaction.user}, sorununu buraya yazabilirsin.`,
      components: [row],
    });

    await interaction.reply({ content: `✅ Ticket açıldı: ${channel}`, ephemeral: true });
  }

  // 📌 Ticket kapatma
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    if (!interaction.channel.name.startsWith("ticket-")) {
      return interaction.reply({ content: "❌ Bu buton sadece ticket kanallarında çalışır.", ephemeral: true });
    }

    await interaction.reply({ content: "📌 Ticket kapatılıyor...", ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 3000);
  }
});


// 🎯 EHLIYET EVENTLERİ (örnek: kullanıcı sunucuya girince ehliyeti yoksa uyarı)
const db = require("quick.db");

client.on(Events.GuildMemberAdd, member => {
  const ehliyet = db.get(`ehliyet_${member.id}`);
  if (!ehliyet) {
    member.send("👋 Sunucuya hoş geldin! Ehliyetin yok, almak için `/ehliyet-al` komutunu kullanabilirsin. 🚗💨")
      .catch(() => console.log("Kullanıcıya DM gönderilemedi."));
  }
});

client.on(Events.GuildMemberRemove, member => {
  const ehliyet = db.get(`ehliyet_${member.id}`);
  if (ehliyet) {
    console.log(`📌 ${member.user.tag} sunucudan ayrıldı. Ehliyeti: ${ehliyet.durum}`);
  }
});

client.login(process.env.TOKEN);
