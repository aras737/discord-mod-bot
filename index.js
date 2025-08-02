const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');
const path = require('path');

// Ortam değişkenlerinden al (Render kullanımı için)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Sahte port aç (Render için)
http.createServer((req, res) => res.end('Bot aktif')).listen(PORT, () => {
  console.log(`🌐 Sahte port ${PORT} dinleniyor.`);
});

// Eksik değişken kontrolü
if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik! Render ortam değişkenlerini kontrol et.");
  process.exit(1);
}

// Bot istemcisi
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Komutları yükle ve göster
for (const file of commandFiles) {
  const filePath = path.join('./commands', file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());

    console.log(`✅ Komut yüklendi: /${command.data.name}`);
    
    // Komut içeriğini göster (ilk 1000 karakter)
    const kod = fs.readFileSync(filePath, 'utf8');
    console.log(`📂 ${file} içeriği:\n` + kod.slice(0, 1000));
  } else {
    console.warn(`⚠️ ${file} geçerli bir komut değil (data/execute eksik).`);
  }
}

// Slash komutları sunucuya gönder
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Mevcut komutlar sıfırlanıyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Yeni komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`📦 ${data.length} komut başarıyla yüklendi.`);
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
    process.exit(1);
  }
})();

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);
});

// Komutlar çalıştırıldığında
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`❌ Komut bulunamadı: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ Komut çalıştırma hatası (${interaction.commandName}):`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
