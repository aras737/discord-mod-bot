const { Client, GatewayIntentBits, Collection, REST, Routes, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Rütbe tablosu (yüksekten düşüğe)
const rankMap = {
  "Kurucu": 5,
  "Yönetici": 4,
  "Moderatör": 3,
  "Denetçi": 2,
  "Destek": 1
};

// Kullanıcının en yüksek rütbesini bul
function getUserRankLevel(member) {
  let highestRankLevel = 0;

  for (const [roleName, rankLevel] of Object.entries(rankMap)) {
    if (member.roles.cache.some(r => r.name === roleName)) {
      if (rankLevel > highestRankLevel) {
        highestRankLevel = rankLevel;
      }
    }
  }

  return highestRankLevel;
}

// Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Express (uptime için)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('✅ Bot çalışıyor.'));
app.listen(PORT, () => {
  console.log(`🌐 Express portu dinleniyor: ${PORT}`);
});

// Komutlar
client.commands = new Collection();
const komutlar = [];
const komutKlasoru = './commands';

try {
  const komutDosyalari = fs.readdirSync(komutKlasoru).filter(f => f.endsWith('.js'));

  for (const file of komutDosyalari) {
    const command = require(`${komutKlasoru}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Hatalı komut: ${file}`);
    }
  }
} catch (err) {
  console.error('❌ Komutlar yüklenemedi:', err);
}

// Bot hazır olunca
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: komutlar }
    );
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }
});

// Interaction sistemi (hem komutlar hem bilet butonları)
client.on('interactionCreate', async interaction => {

  // 📌 Bilet buton sistemi
  if (interaction.isButton()) {
    if (interaction.customId === 'ticket-olustur') {
      const kanal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
          }
        ]
      });

      await kanal.send({
        content: `🎫 ${interaction.user}, destek talebin oluşturuldu.`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket-kapat')
              .setLabel('❌ Bileti Kapat')
              .setStyle(ButtonStyle.Danger)
          )
        ]
      });

      return interaction.reply({ content: `✅ Biletin açıldı: ${kanal}`, ephemeral: true });
    }

    if (interaction.customId === 'ticket-kapat') {
      await interaction.channel.delete().catch(() => {});
      return;
    }
  }

  // 📌 Slash komutlar
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`❌ Komut hatası:`, err);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
      }
    }
  }
});

// Mesaj komutları (küfür engel)
client.on('messageCreate', message => {
  if (message.author.bot) return;

  const kufurler = ['salak', 'aptal', 'malamk', 'aq', 'orospu', 'sik', 'piç', 'anan', 'yarrak', 'mk']; // genişletilebilir
  if (kufurler.some(k => message.content.toLowerCase().includes(k))) {
    message.delete().catch(() => {});
    message.channel.send('🚫 Bu sunucuda küfür yasaktır!');
  }
});

// Hata yakalama
process.on('uncaughtException', err => console.error('🚨 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('🚨 Unhandled Rejection:', err));

// Giriş
client.login(process.env.TOKEN);
