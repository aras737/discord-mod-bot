const { 
  Client, GatewayIntentBits, Collection, REST, Routes, 
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType 
} = require('discord.js');

const express = require('express');
const fs = require('fs');
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

// Bot hazır olduğunda
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

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

// Etkileşimler
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === 'ticket-olustur') {
      const kanalIsmi = rastgeleIsim();
      const kanal = await interaction.guild.channels.create({
        name: kanalIsmi,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        ],
      });

      const kapatButton = new ButtonBuilder()
        .setCustomId('ticket-kapat')
        .setLabel('❌ Bileti Kapat')
        .setStyle(ButtonStyle.Danger);
      const row = new ActionRowBuilder().addComponents(kapatButton);

      await kanal.send({ content: `${interaction.user}, destek talebin oluşturuldu!`, components: [row] });
      await interaction.reply({ content: `✅ Bilet açıldı: ${kanal}`, ephemeral: true });
      return;
    }

    if (interaction.customId === 'ticket-kapat') {
      await interaction.channel.delete().catch(() => {});
      return;
    }
  }

  if (interaction.isCommand()) {
    const commandName = interaction.commandName;
    const memberRoles = interaction.member.roles.cache.map(r => r.name);
    let seviye = null;
    if (memberRoles.some(r => config.roles.ust.includes(r))) seviye = "ust";
    else if (memberRoles.some(r => config.roles.orta.includes(r))) seviye = "orta";
    else if (memberRoles.some(r => config.roles.alt.includes(r))) seviye = "alt";

    if (!seviye) return interaction.reply({ content: "🚫 Bu komutu kullanmak için yetkin yok.", ephemeral: true });
    if (!config.commands[seviye].includes(commandName)) return interaction.reply({ content: "🚫 Bu komut senin yetki seviyene kapalı.", ephemeral: true });

    const command = client.commands.get(commandName);
    if (!command) return;

    try { await command.execute(interaction); } 
    catch (err) {
      console.error(`❌ Komut hatası:`, err);
      if (!interaction.replied) await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
    }
  }
});

// Küfür engelleme
client.on('messageCreate', message => {
  if (message.author.bot) return;
  const kufurler = ['salak','aptal','malamk','aq','orospu','sik','piç','anan','yarrak','mk'];
  if (kufurler.some(k => message.content.toLowerCase().includes(k))) {
    message.delete().catch(() => {});
    message.channel.send('🚫 Bu sunucuda küfür yasaktır!').catch(() => {});
  }
});

// Express web ve panel
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('✅ Bot çalışıyor.'));

app.get('/panel', (req, res) => {
  let komutlarHtml = '';
  client.commands.forEach((cmd, name) => {
    komutlarHtml += `<button onclick="fetch('/panel/komut/${name}').then(r => r.text()).then(alert)">${name}</button><br/><br/>`;
  });

  res.send(`
    <html>
      <head>
        <title>TPA TKA Yönetim Paneli</title>
        <style>
          body { font-family: Arial; text-align: center; margin-top: 50px; background: #f4f4f4; }
          h1 { color: #4caf50; }
          button { padding: 10px 20px; font-size: 16px; cursor: pointer; margin: 5px; }
          .status { margin-top: 20px; font-weight: bold; color: #333; }
        </style>
      </head>
      <body>
        <h1>TPA TKA Yönetim Paneli</h1>
        <p>Bot aktif: <span class="status">${client.user ? client.user.tag : 'Yükleniyor...'}</span></p>
        <h2>Slash Komutlar</h2>
        ${komutlarHtml}
      </body>
    </html>
  `);
});

app.get('/panel/komut/:komut', async (req, res) => {
  const komutAdi = req.params.komut;
  const command = client.commands.get(komutAdi);
  if (!command) return res.send('❌ Komut bulunamadı!');

  try {
    const guild = client.guilds.cache.first();
    if (!guild) return res.send('❌ Bot herhangi bir sunucuda değil!');
    const kanal = guild.channels.cache.filter(c => c.type === 0).first();
    if (!kanal) return res.send('❌ Sunucuda kanal bulunamadı!');

    await kanal.send(`Komut panelden çalıştırıldı: ${komutAdi}`);
    res.send(`✅ Komut çalıştırıldı: ${komutAdi}`);
  } catch (err) {
    console.error('❌ Panelden komut hatası:', err);
    res.send('❌ Komut çalıştırılamadı!');
  }
});

app.listen(PORT, () => console.log(`🌐 Express portu dinleniyor: http://localhost:${PORT}`));

// Hata yakalama
process.on('uncaughtException', err => console.error('🚨 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('🚨 Unhandled Rejection:', err));

client.login(process.env.TOKEN);
