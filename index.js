const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Render ortam değişkenlerinden alıyoruz
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Sahte port aç (Render için botun "uyanık" kalması)
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot aktif!');
}).listen(PORT, () => {
  console.log(`🌐 Render port dinleniyor: ${PORT}`);
});

// Zorunlu değişken kontrolü
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik! Render Environment sekmesinden ayarla.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Uyarı: ${file} geçerli bir slash komut değil (data/execute eksik).`);
  }
}

// Slash komutları yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Komutlar güncelleniyor...');

    // Komutları sunucuya özel yükle (hızlı güncellenir)
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ ${data.length} komut başarıyla yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
    process.exit(1);
  }
})();

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`🤖 ${client.user.tag} olarak giriş yaptı.`);
});

// Slash komut etkileşimleri
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`❌ Komut bulunamadı: /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`⚠️ Komut çalıştırılırken hata: /${interaction.commandName}`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Bir hata oluştu.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
