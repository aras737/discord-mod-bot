// ========== ÇEKİRDEK ==========
const {
  Client, GatewayIntentBits, Collection, REST, Routes, Events
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

// ========== CLIENT ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

client.commands = new Collection();
const komutlarJSON = [];

// ========== KOMUTLARI YÜKLE ==========
const komutKlasoru = path.join(__dirname, 'commands');
const dosyalar = fs.readdirSync(komutKlasoru).filter(f => f.endsWith('.js'));

for (const f of dosyalar) {
  const filePath = path.join(komutKlasoru, f);
  const cmd = require(filePath);
  if (cmd?.data && cmd?.execute) {
    client.commands.set(cmd.data.name, cmd);
    komutlarJSON.push(cmd.data.toJSON());
    console.log(`✅ Komut yüklendi: ${cmd.data.name}`);
  } else {
    console.warn(`⚠️ Hatalı komut: ${f}`);
  }
}

// ========== BOT HAZIR ==========
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  // Slash komutlarını Discord'a yükle
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlarJSON });
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yüklenemedi:', err);
  }

  // Express server (Render için)
  const app = express();
  const PORT = process.env.PORT || 8080;
  app.get('/', (_, res) => res.send('✅ Bot çalışıyor.'));
  app.listen(PORT, () => console.log(`🌐 Express portu: ${PORT}`));
});

// ========== INTERACTION ==========
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ Bir hata oluştu!', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
    }
  }
});

// ========== HATA YAKALAMA ==========
process.on('uncaughtException', e => console.error('🚨 Uncaught Exception:', e));
process.on('unhandledRejection', e => console.error('🚨 Unhandled Rejection:', e));

// ========== BOTU BAŞLAT ==========
if (!process.env.TOKEN) {
  console.error('❌ .env içine TOKEN eklemen lazım!');
  process.exit(1);
}
client.login(process.env.TOKEN);
