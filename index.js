// index.js (veya ana bot dosyanız)
const fs = require('fs');
const path = require('path');
const { 
  Client, 
  Collection, 
  GatewayIntentBits, 
  Partials, 
  Events, 
  REST, 
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fetch = require('node-fetch'); // node-fetch modülünü ekleyin
require('dotenv').config();

// Client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const commands = [];

// Komutları yükle
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Komut yüklendi: ${command.data.name}`);
  } else {
    console.log(`⚠️ Komut eksik: ${file}`);
  }
}

// Roblox oyun aktiflik kontrolü fonksiyonu (Hata yakalama eklendi)
async function checkRobloxGame() {
    const universeId = "91145006228484";
    const url = `https://www.roblox.com/tr/games/91145006228484/TKA-asker-oyunu`;
    try {
        const res = await fetch(url);
        
        // Hatanın tam olarak ne olduğunu görmek için buraya log ekleyin
        if (!res.ok) {
            console.error(`Roblox API'den hata kodu alındı: ${res.status} - ${res.statusText}`);
            console.error("API yanıtı:", await res.text());
            throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Roblox API yanıtı:", data); // Yanıtı konsola yazdırın
        
        const game = data.data[0];
        if (!game) {
            console.error("Oyun bilgisi API yanıtında bulunamadı!");
            return null;
        }

        return {
            oyuncular: game.playing,
            favoriler: game.favoritedCount,
            ziyaretler: game.visits,
            link: "https://www.roblox.com/tr/games/91145006228484/TKA-asker-oyunu"
        };
    } catch (err) {
        console.error("Roblox API hatası:", err);
        return null;
    }
}

// Komutları Discord'a kaydet ve bot hazır olduğunda aktiflik sistemini başlat
client.once(Events.ClientReady, async () => {
    console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);

    // Slash komutlarını yükle
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ Slash komutları başarıyla yüklendi.');
    } catch (err) {
        console.error(err);
    }
    
    // --- BURAYA AKTİFLİK KODUNU EKLEDİK ---
    const channelId = "1407448511091314739"; // Aktifliğin atılacağı kanal ID'si
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        console.error("❌ Kanal bulunamadı!");
        return; 
    }

    let statusMessage = null; 

    // İlk mesajı gönder
    const info = await checkRobloxGame();
    const initialTable = info ?
    `🎮 **TKA Asker Oyunu Aktiflik**\n---------------------------------\n👥 Oyuncular: **${info.oyuncular}**\n⭐ Favoriler: **${info.favoriler}**\n👀 Ziyaretler: **${info.ziyaretler}**\n🔗 [Oyuna Git](${info.link})\n---------------------------------` :
    "❌ Roblox oyun bilgisi alınamadı.";

    statusMessage = await channel.send(initialTable);

    // Her 10 saniyede bir mesajı güncelle
    setInterval(async () => {
        const updatedInfo = await checkRobloxGame();
        if (updatedInfo && statusMessage) {
            const updatedTable = `🎮 **TKA Asker Oyunu Aktiflik**\n---------------------------------\n👥 Oyuncular: **${updatedInfo.oyuncular}**\n⭐ Favoriler: **${updatedInfo.favoriler}**\n👀 Ziyaretler: **${updatedInfo.ziyaretler}**\n🔗 [Oyuna Git](${updatedInfo.link})\n---------------------------------`;
            try {
                await statusMessage.edit(updatedTable);
            } catch (error) {
                console.error("Mesaj düzenlenirken bir hata oluştu:", error);
                statusMessage = await channel.send(updatedTable);
            }
        }
    }, 10000); // Her 10 saniye
});

// Interaction event
client.on(Events.InteractionCreate, async interaction => {
  // Slash Komutlar
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Bir hata oluştu!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
      }
    }
  }

  // 🎟️ Bilet oluşturma
  if (interaction.isButton() && interaction.customId === 'create_ticket') {
    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({ content: `❌ Zaten açık biletin var: ${existing}`, ephemeral: true });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: 0, // Text channel
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
      ],
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Kapat')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `🎟️ Merhaba ${interaction.user}, sorununu buraya yazabilirsin.`,
      components: [row],
    });

    await interaction.reply({ content: `✅ Bilet açıldı: ${channel}`, ephemeral: true });
  }

  // 📌 Bilet kapatma
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Bu buton sadece bilet kanallarında çalışır.', ephemeral: true });
    }

    await interaction.reply({ content: '📌 Bilet kapatılıyor...', ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 3000);
  }
});

client.login(process.env.TOKEN);
