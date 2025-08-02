const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Ortam değişkenleri (Render veya .env'den)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Render için sahte sunucu
http.createServer((req, res) => res.end('Bot aktif')).listen(PORT, () => {
  console.log(`🌐 Bot aktif, port ${PORT}`);
});

// Hatalı değişken kontrolü
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik. Render'da environment variables kontrol et.");
  process.exit(1);
}

// Client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Komut koleksiyonu
client.commands = new Collection();

// Komutları yükle
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ ${file} komut dosyası geçersiz (data/execute eksik)`);
  }
}

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Etkileşimleri dinle
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ Komut hatası (${interaction.commandName}):`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
    }
  }
});

// Token ile giriş yap
client.login(TOKEN);
