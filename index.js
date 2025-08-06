require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// Komutları yükle
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  console.log(`✅ Komut yüklendi: ${command.data.name}`);
}

// Slash komutları çalıştır
const { REST, Routes } = require("discord.js");
const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// Slash komutları yükle
(async () => {
  try {
    console.log("⚙️ Slash komutlar yükleniyor...");
    await rest.put(
      Routes.applicationCommands("BOT_ID"), // <<< BOT_ID yerine kendi bot ID'ni yaz
      { body: commands }
    );
    console.log("✅ Slash komutlar yüklendi.");
  } catch (error) {
    console.error("❌ Slash komut yükleme hatası:", error);
  }
})();

// Slash komutları çalıştır
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("❌ Komut çalıştırma hatası:", error);
    await interaction.reply({ content: "❌ Komut çalıştırılamadı!", ephemeral: true });
  }
});

// Bot hazır olduğunda logla
client.once("ready", () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// Express ile botu Render’da canlı tut
const app = express();
app.get("/", (req, res) => res.send("Bot Aktif!"));
app.listen(3000, () => console.log("🌐 Express portu dinleniyor: 3000"));

// Giriş
client.login(process.env.TOKEN);
