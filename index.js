require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

// ✅ Komutları Yükle
const komutlarDizini = path.join(__dirname, 'komutlar');
const komutlarArray = [];
const yuklenenler = [];
const yuklenemeyenler = [];

if (fs.existsSync(komutlarDizini)) {
  const dosyalar = fs.readdirSync(komutlarDizini).filter(file => file.endsWith('.js'));

  for (const file of dosyalar) {
    const komutYolu = path.join(komutlarDizini, file);
    try {
      const komut = require(komutYolu);
      if ('data' in komut && 'execute' in komut) {
        client.commands.set(komut.data.name, komut);
        komutlarArray.push(komut.data.toJSON());
        yuklenenler.push(file);
      } else {
        yuklenemeyenler.push(`${file} (eksik 'data' veya 'execute')`);
      }
    } catch (error) {
      yuklenemeyenler.push(`${file} (yükleme hatası: ${error.message})`);
    }
  }
} else {
  console.log("❌ 'komutlar' klasörü bulunamadı.");
}

// ✅ Bot Hazır Olduğunda
client.once('ready', async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
  console.log(`📦 Komutlar Discord API'ye yükleniyor...`);

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: komutlarArray }
    );
    console.log(`✅ Discord API'ye yüklenen komut sayısı: ${komutlarArray.length}`);
  } catch (error) {
    console.error('❌ Komutlar API\'ye yüklenirken hata:', error);
  }

  console.log(`✅ Yüklenen komutlar: ${yuklenenler.join(', ') || 'Yok'}`);
  console.log(`❌ Yüklenemeyen komutlar: ${yuklenemeyenler.join(', ') || 'Yok'}`);
});

// ✅ Komut Çalıştırma
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const komut = client.commands.get(interaction.commandName);
  if (!komut) return;

  try {
    await komut.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ Komutu çalıştırırken bir hata oluştu.', ephemeral: true });
  }
});

// ✅ Express Uptime (Render için)
const app = express();
app.get('/', (req, res) => res.send('Bot aktif'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});

// ✅ BOTU GİRİŞ YAPTIR
client.login(process.env.TOKEN);
