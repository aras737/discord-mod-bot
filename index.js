const { Client, GatewayIntentBits, Collection } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();

const TOKEN = process.env.TOKEN;

// Komutları yükleme (örnek: ./commands klasöründeki tüm komutlar)
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);

  // Konsola komutlar hakkında bilgi yaz
  if (client.commands.size > 0) {
    console.log(`📂 Yüklü komut sayısı: ${client.commands.size}`);
    if (client.commands.has('ban')) {
      console.log('🔨 Ban komutu yüklendi ve aktif.');
    }
    // İstersen başka komutlar için de ekleyebilirsin
  } else {
    console.log('⚠️ Komut bulunamadı!');
  }
});

// Basit sahte HTTP server (Render için port açmak amacıyla)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot çalışıyor ve port aktif.');
}).listen(PORT, () => {
  console.log(`🌐 Sahte port aktif: http://localhost:${PORT}`);
});

client.login(TOKEN);
