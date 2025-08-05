// Gerekli modüller
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Yeni Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Slash komutları kaydetme için koleksiyon
client.commands = new Collection();

// Komutları oku ve yükle
const komutKlasoru = './komutlar';
const komutlar = [];
fs.readdirSync(komutKlasoru).filter(file => file.endsWith('.js')).forEach(file => {
  const command = require(`${komutKlasoru}/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    komutlar.push(command.data.toJSON());
  } else {
    console.warn(`[UYARI] ${file} komut dosyasında "data" veya "execute" eksik.`);
  }
});

// Komutları Discord API'ye gönder (guild bazlı)
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('♻️ Eski komutlar temizleniyor...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlar });
    console.log('✅ Slash komutlar yüklendi.');
  } catch (error) {
    console.error('❌ Komut yüklenirken hata oluştu:', error);
  }
});

// Slash komutları çalıştır
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Komut çalıştırma hatası: ${error}`);
    await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
  }
});

// Hata engelleyici
process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// Botu başlat
client.login(process.env.TOKEN);
