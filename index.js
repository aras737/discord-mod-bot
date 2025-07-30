const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Render ortam değişkenlerinden alıyoruz
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Sahte port aç (Render için)
http.createServer((req, res) => res.end('Bot aktif')).listen(PORT, () => {
  console.log(`🌐 Sahte port ${PORT} dinleniyor.`);
});

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik! Render Environment Variables ayarlarını kontrol et.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ ${file} komutu 'data' veya 'execute' içermiyor.`);
  }
}

// Komutları sunucuya yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Komutlar sunucudan temizleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ ${data.length} komut yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
    process.exit(1);
  }
})();

client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

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
    console.error(`❌ ${interaction.commandName} çalıştırılırken hata:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
