const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

client.commands = new Collection();

// Komutları yükle
const komutKlasoru = path.join(__dirname, 'commands');
if (fs.existsSync(komutKlasoru)) {
  const komutDosyalari = fs.readdirSync(komutKlasoru).filter(f => f.endsWith('.js'));
  for (const file of komutDosyalari) {
    const command = require(path.join(komutKlasoru, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
} else {
  console.warn('⚠️ Komut klasörü yok.');
}

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Slash komut dinleyici
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Komut hatası: ${error}`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '⚠️ Bir hata oluştu.', ephemeral: true });
    }
  }
}); // 🔴 Buradan sonra fazladan } olmasın!

// Express ile keep-alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot çalışıyor.'));
app.listen(PORT, () => console.log(`🌐 Web sunucusu ${PORT} portunda aktif.`));

// Giriş
client.login(process.env.TOKEN);
