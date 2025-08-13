const { 
  Client, GatewayIntentBits, Collection, REST, Routes, 
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType 
} = require('discord.js');

const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Komutlar için koleksiyon ve komutları yükleme
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

// Rastgele isim oluşturucu (ticket sistemi için)
function rastgeleIsim() {
  const kelimeler = ["zephyr", "nova", "orbit", "pulse", "quantum", "vortex", "storm", "ember", "echo"];
  const sayi = Math.floor(Math.random() * 1000);
  const kelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
  return `ticket-${kelime}-${sayi}`;
}

client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  // Üst yetkiye tüm komutları ekle
  config.commands.ust = Array.from(client.commands.keys());

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

client.on('interactionCreate', async interaction => {
  // Buton etkileşimleri (ticket sistemi)
  if (interaction.isButton()) {
    if (interaction.customId === 'ticket-olustur') {
      const kanalIsmi = rastgeleIsim();

      const kanal = await interaction.guild.channels.create({
        name: kanalIsmi,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel, 
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ],
          },
        ],
      });

      const kapatButton = new ButtonBuilder()
        .setCustomId('ticket-kapat')
        .setLabel('❌ Bileti Kapat')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(kapatButton);

      await kanal.send({ 
        content: `${interaction.user}, destek talebin oluşturuldu!`,
        components: [row]
      });

      await interaction.reply({ content: `✅ Bilet açıldı: ${kanal}`, ephemeral: true });
      return;
    }

    if (interaction.customId === 'ticket-kapat') {
      await interaction.channel.delete().catch(() => {});
      return;
    }
  }

  // Slash komutları yetki kontrolü
  if (interaction.isCommand()) {
    const commandName = interaction.commandName;
    const memberRoles = interaction.member.roles.cache.map(r => r.name);

    let seviye = null;
    if (memberRoles.some(r => config.roles.ust.includes(r))) seviye = "ust";
    else if (memberRoles.some(r => config.roles.orta.includes(r))) seviye = "orta";
    else if (memberRoles.some(r => config.roles.alt.includes(r))) seviye = "alt";

    if (!seviye) {
      return interaction.reply({ content: "🚫 Bu komutu kullanmak için yetkin yok.", ephemeral: true });
    }

    if (!config.commands[seviye].includes(commandName)) {
      return interaction.reply({ content: "🚫 Bu komut senin yetki seviyene kapalı.", ephemeral: true });
    }

    const command = client.commands.get(commandName);
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

// Küfür engelleme
client.on('messageCreate', message => {
  if (message.author.bot) return;
  const kufurler = ['salak', 'aptal', 'malamk', 'aq', 'orospu', 'sik', 'piç', 'anan', 'yarrak', 'mk'];
  if (kufurler.some(k => message.content.toLowerCase().includes(k))) {
    message.delete().catch(() => {});
    message.channel.send('🚫 Bu sunucuda küfür yasaktır!').catch(() => {});
  }
});

// ---------------- WEB PANEL ----------------
const app = express();
const PORT = process.env.PORT || 3000;

// Panel sayfası
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html'));
});

// Web panel komutları
app.get('/action/:cmd', async (req, res) => {
  const cmd = req.params.cmd.toLowerCase();
  const allowed = Array.from(client.commands.keys());

  if (!allowed.includes(cmd)) {
    return res.status(400).send(`Geçersiz komut: ${cmd}`);
  }

  const logChannel = client.channels.cache.get(config.logChannelId);
  if (logChannel) logChannel.send(`🌐 Web Panel: **${cmd}** komutu çalıştırıldı.`);

  // Discord slash komutunu webden çalıştır
  try {
    const fakeInteraction = {
      commandName: cmd,
      member: { roles: { cache: [{ name: config.roles.ust[0] }] } }, // ust yetki veriyoruz
      reply: async (msg) => console.log(`Web Panel Yanıt:`, msg),
      isCommand: () => true
    };
    await client.commands.get(cmd).execute(fakeInteraction);
    res.send(`✅ ${cmd} komutu başarıyla çalıştırıldı.`);
  } catch (err) {
    console.error(`❌ Web Panel komut hatası:`, err);
    res.status(500).send(`❌ Komut hatası: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`🌐 Web panel portu dinleniyor: ${PORT}`));

// Hata yakalama
process.on('uncaughtException', err => console.error('🚨 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('🚨 Unhandled Rejection:', err));

// Bot giriş
client.login(process.env.TOKEN);
