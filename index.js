const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Render ortam değişkenlerini al
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Render için sahte port
http.createServer((req, res) => res.end('Bot aktif')).listen(PORT, () =>
  console.log(`🌐 Port ${PORT} aktif (Render bekleme için).`)
);

// Zorunlu kontrol
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Gerekli ortam değişkenleri eksik (TOKEN, CLIENT_ID, GUILD_ID). Render Environment ayarlarını kontrol et.");
  process.exit(1);
}

// Discord Client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Komutları oku ve dizine ekle
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Uyarı: ${file} komutu 'data' veya 'execute' içermiyor.`);
  }
}

// Slash komutları ZORLA yüklemeden bota giriş yaptırma
(async () => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('🔄 Mevcut komutlar temizleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Slash komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    console.log(`✅ ${data.length} komut yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));

    // Eğer komut yükleme başarılıysa giriş yap
    client.login(TOKEN);

  } catch (error) {
    console.error('❌ Slash komut yükleme sırasında hata oluştu:');
    console.error(error);
    process.exit(1); // ZORLA çık, bot başlamasın
  }
})();
