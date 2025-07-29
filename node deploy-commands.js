const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Komutları yükle
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// Token, clientId ve guildId .env'den
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// GUILD KOMUTU olarak yükle (sadece belirli sunucuda çalışır ve anında güncellenir)
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
  .then(() => console.log('✅ Komutlar sunucuya (GUILD) yüklendi.'))
  .catch(console.error);
