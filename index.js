const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// SAHTE PORT (uyuma önleyici - Render için)
require('http')
  .createServer((req, res) => res.end('✅ Bot aktif!'))
  .listen(process.env.PORT || 3000);

// .env'den bilgileri al
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const commands = [];

// commands klasöründeki komutları yükle
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// Slash komutları sıfırla ve yeniden yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('⏳ Eski komutlar siliniyor ve yeni komutlar yükleniyor...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ ${data.length} komut başarıyla yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Komut yükleme hatası:', error);
  }
})();

client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

client.login(TOKEN);
