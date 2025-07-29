const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');

// Bot bilgilerini buraya yaz:
const token = 'MTM5NDQyODEwMTM2NjI1NTY1Ng.GDTg3G.Lx9e_nelXb1Jij631bVc3uB21PxwJBwsf2Xazo';
const clientId = '1394428101366255656';
const guildId = '1394407092106039307';

// Render sahte port (PORT hatasını önler)
require('http')
  .createServer((_, res) => res.end('Bot aktif!'))
  .listen(process.env.PORT || 3000);

// Discord istemcisi
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

// Komutları topla
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// Komutları sıfırla ve tekrar yükle
const rest = new REST().setToken(token);

(async () => {
  try {
    console.log('🧹 Eski komutlar siliniyor...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });

    console.log('📦 Yeni komutlar yükleniyor...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log(`✅ ${commands.length} komut yüklendi:`);
    commands.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Komut yükleme hatası:', error);
  }
})();

// Bot hazır
client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// Slash komutları çalıştır
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
  }
});

// Botu başlat
client.login(token);
