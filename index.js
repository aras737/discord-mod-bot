const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

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
app.listen(PORT, () => console.log(`🌐 Express portu dinleniyor: ${PORT}`));

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
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlar });
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }
});

// ===== Bilet Sistemi =====
const aktifBiletler = new Map(); // Kullanıcı ID -> Kanal ID

client.on('interactionCreate', async interaction => {
  // Slash komutlar
  if (interaction.isCommand()) {
    if (interaction.commandName === 'bilet') {
      const embed = new EmbedBuilder()
        .setTitle('🎫 Destek Sistemi')
        .setDescription('Merhaba! Discord,Roblox oyunu vb Sorunlarımız için. Aşağıdaki butona tıklayarak bilet açabilirsiniz.')
        .setColor('Blue');

      const buton = new ButtonBuilder()
        .setCustomId('bilet_ac')
        .setLabel('Bilet Aç')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(buton);

      return interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // Buton işlemleri
  if (interaction.isButton()) {
    // Bilet açma
    if (interaction.customId === 'bilet_ac') {
      if (aktifBiletler.has(interaction.user.id)) {
        return interaction.reply({ content: '❌ Zaten açık bir biletiniz var!', ephemeral: true });
      }

      const kanal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] }
        ]
      });

      aktifBiletler.set(interaction.user.id, kanal.id);

      const kapatButon = new ButtonBuilder()
        .setCustomId('bilet_kapat')
        .setLabel('Bileti Kapat')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(kapatButon);

      await kanal.send({ content: `🎫 ${interaction.user}, hoş geldiniz! Lütfen sorununuzu detaylı şekilde yazın.`, components: [row] });
      return interaction.reply({ content: `✅ Biletiniz açıldı: ${kanal}`, ephemeral: true });
    }

    // Bilet kapatma
    if (interaction.customId === 'bilet_kapat') {
      const kanal = interaction.channel;
      const sahip = [...aktifBiletler.entries()].find(([k, v]) => v === kanal.id);
      if (sahip) aktifBiletler.delete(sahip[0]);

      await interaction.reply('⏳ Bilet kapatılıyor...');
      setTimeout(() => kanal.delete().catch(() => {}), 2000);
    }
  }
});

// Mesaj filtreleme (küfür engel)
client.on('messageCreate', message => {
  if (message.author.bot) return;
  const kufurler = ['salak', 'aptal', 'malamk', 'aq', 'orospu', 'sik', 'piç', 'anan', 'yarrak', 'mk'];
  if (kufurler.some(k => message.content.toLowerCase().includes(k))) {
    message.delete().catch(() => {});
    message.channel.send('🚫 Bu sunucuda küfür yasaktır!');
  }
});

// Eventler
client.on('guildMemberAdd', member => require('./events/guildMemberAdd').execute(member));
client.on('guildMemberRemove', member => require('./events/guildMemberRemove').execute(member));

// Hata yakalama
process.on('uncaughtException', err => console.error('🚨 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('🚨 Unhandled Rejection:', err));

// Giriş
client.login(process.env.TOKEN);
