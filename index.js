const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[UYARI] ${file} dosyasında 'data' veya 'execute' eksik.`);
    }
  }
} else {
  console.warn('⚠️ Komutlar klasörü bulunamadı.');
}

client.once('ready', () => {
  console.log(`🤖 Bot aktif oldu: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('❌ Komut çalıştırma hatası:', error);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: '⚠️ Komut çalışılırken hata oluştu.', ephemeral: true });
      } catch {}
    }
  }
});

process.on('uncaughtException', error => {
  console.error('🚨 Uncaught Exception:', error);
});
process.on('unhandledRejection', error => {
  console.error('🚨 Unhandled Rejection:', error);
});

client.login(process.env.TOKEN);
