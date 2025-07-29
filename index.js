require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const http = require('http');

// SAHTE HTTP SUNUCU (Render için gerekli)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot çalışıyor!');
}).listen(process.env.PORT || 3000);

// DISCORD BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[UYARI] ${file} geçerli bir komut değil.`);
    }
  }
} else {
  console.log('[UYARI] commands klasörü bulunamadı.');
}

// Komut dinleyicisi
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
  }
});

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// BOT TOKEN İLE GİRİŞ
client.login(process.env.TOKEN);
