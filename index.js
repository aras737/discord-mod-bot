// index.js
const { 
  Client, GatewayIntentBits, Collection, REST, Routes, 
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder
} = require('discord.js');
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

// Rastgele isim oluşturucu (ticket)
function rastgeleIsim() {
  const kelimeler = ["zephyr", "nova", "orbit", "pulse", "quantum", "vortex", "storm", "ember", "echo"];
  const sayi = Math.floor(Math.random() * 1000);
  const kelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
  return `ticket-${kelime}-${sayi}`;
}

// Bot aktif
client.once('ready', async () => {
  console.log(`\x1b[32m🤖 Bot aktif: ${client.user.tag}\x1b[0m`);

  // Slash komutları yükle
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: komutlar }
    );
    console.log('\x1b[36m✅ Slash komutlar yüklendi.\x1b[0m');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }
});

// Interaction
client.on('interactionCreate', async interaction => {
  // Buton etkileşimleri (ticket)
  if (interaction.isButton()) {
    if (interaction.customId === 'ticket-olustur') {
      const kanalIsmi = rastgeleIsim();
      const kanal = await interaction.guild.channels.create({
        name: kanalIsmi,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
          ]},
        ],
      });

      const kapatButton = new ButtonBuilder()
        .setCustomId('ticket-kapat')
        .setLabel('❌ Bileti Kapat')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(kapatButton);

      const embed = new EmbedBuilder()
        .setTitle('🎫 Destek Talebi Oluşturuldu!')
        .setDescription(`${interaction.user} burası senin destek kanalın.`)
        .setColor('Blue')
        .setTimestamp();

      await kanal.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Bilet açıldı: ${kanal}`, ephemeral: true });
      return;
    }

    if (interaction.customId === 'ticket-kapat') {
      const embed = new EmbedBuilder()
        .setTitle('❌ Bilet kapatılıyor...')
        .setColor('Red')
        .setTimestamp();
      await interaction.channel.send({ embeds: [embed] });
      await interaction.channel.delete().catch(() => {});
      return;
    }
  }

  // Slash komutları
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const memberRoles = interaction.member.roles.cache.map(r => r.name);
    let seviye = null;
    if (memberRoles.some(r => config.roles.ust.includes(r))) seviye = "ust";
    else if (memberRoles.some(r => config.roles.orta.includes(r))) seviye = "orta";
    else if (memberRoles.some(r => config.roles.alt.includes(r))) seviye = "alt";

    if (!seviye) return interaction.reply({ content: "🚫 Yetkin yok.", ephemeral: true });
    if (!config.commands[seviye].includes(interaction.commandName)) 
      return interaction.reply({ content: "🚫 Komut senin yetkine kapalı.", ephemeral: true });

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error('❌ Komut hatası:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
      }
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

// Hata yakalama
process.on('uncaughtException', err => console.error('🚨 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('🚨 Unhandled Rejection:', err));

// Bot giriş
client.login(process.env.TOKEN);
