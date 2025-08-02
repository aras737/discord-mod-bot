const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Render ortam değişkenlerinden al
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Render için sahte port
http.createServer((req, res) => res.end('Bot aktif')).listen(PORT, () =>
  console.log(`🌐 Port ${PORT} dinleniyor (Render uyumlu).`)
);

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN, CLIENT_ID veya GUILD_ID eksik. Render Environment ayarlarını kontrol et.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Komutları oku
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

// Komutları yükle
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('🔄 Mevcut komutlar temizleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('🚀 Komutlar yükleniyor...');
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ ${data.length} komut yüklendi:`);
    data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
  } catch (error) {
    console.error('❌ Komut yüklenirken hata oluştu:', error);
    process.exit(1);
  }
})();

// Bot hazır
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// interactionCreate: slash + select menu
client.on('interactionCreate', async interaction => {
  // Slash komut
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
      } else {
        await interaction.reply({ content: '⚠️ Komut çalıştırılamadı.', ephemeral: true });
      }
    }
  }

  // Select menu (örnek: ban onayı)
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('ban_confirm_')) {
      const userId = interaction.customId.split('_')[2];
      const reason = interaction.values[0];
      const member = await interaction.guild.members.fetch(userId).catch(() => null);

      if (!member) {
        return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
      }

      try {
        await member.ban({ reason: `Sebep: ${reason} - Banlayan: ${interaction.user.tag}` });

        await interaction.update({
          content: `✅ ${member.user.tag} başarıyla banlandı.\n📌 Sebep: ${reason}`,
          components: [],
        });

        // Banlanan kullanıcıyı hafıza listesine ekle (geçici)
        const { bannedUsers } = require('./commands/ban.js');
        bannedUsers.push(member.user.id);

      } catch (error) {
        console.error('❌ Ban hatası:', error);
        await interaction.update({
          content: '❌ Ban işlemi başarısız oldu.',
          components: [],
        });
      }
    }
  }
});

client.login(TOKEN);
