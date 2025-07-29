const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const { REST, Routes } = require('discord.js');

// Sahte port (Render'da boş port hatasını engellemek için)
require('http')
  .createServer((_, res) => res.end('Bot Aktif!'))
  .listen(process.env.PORT || 3000);

// Bot başlat
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Komutları sırayla topla
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// Slash komutları temizle + yeniden yükle
const rest = new REST().setToken(token);

(async () => {
  try {
    console.log('🧹 Eski komutlar siliniyor...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });

    console.log('📦 Yeni komutlar yükleniyor...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log(`✅ ${commands.length} komut başarıyla yüklendi:`);
    commands.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('Komutlar yüklenirken hata:', error);
  }
})();

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// Slash komutları dinle
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'Komut çalıştırılamadı!', ephemeral: true });
  }
});

// Token ile giriş yap
client.login(token);
