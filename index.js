const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
  console.log(`Komutlar yüklendi! (${client.commands.size} komut)`);
} else {
  console.log('Komut klasörü bulunamadı veya boş.');
}

client.once('ready', () => {
  console.log(`Bot aktif! (${client.user.tag})`);
});

client.login(process.env.TOKEN);
