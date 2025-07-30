const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Render environment değişkenlerini doğrudan alıyoruz
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Render için sahte port açma
http.createServer((req, res) => res.end('Bot aktif!')).listen(PORT, () => {
  console.log(`Sahte port ${PORT} üzerinde dinleniyor.`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Mesaj içeriğini okuyabilmek için gerekli
  ],
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
    console.warn(`[UYARI] ${file} komutu 'data' veya 'execute' içermiyor.`);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Komutlar sıfırlanıyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('Yeni komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    console.log(`✅ ${data.length} komut yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('Komut yükleme hatası:', error);
  }
})();

client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// Basit interactionCreate handler (sonradan dosya olarak ayırabilirsin)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
