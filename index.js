// ========== ÇEKİRDEK ==========
const {
  Client, GatewayIntentBits, Collection, REST, Routes,
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, EmbedBuilder, Events
} = require('discord.js');

const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const ms = require('ms');
dotenv.config();

const config = require('./config.json');

// ========== CLIENT ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
  ],
});

// ========== KOMUT YÜKLEYİCİ ==========
client.commands = new Collection();
const commandsJSON = [];
const commandsFolder = path.join(__dirname, 'commands');

try {
  if (fs.existsSync(commandsFolder)) {
    const files = fs.readdirSync(commandsFolder).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const filePath = path.join(commandsFolder, file);
      const cmd = require(filePath);
      if (cmd?.data && cmd?.execute) {
        client.commands.set(cmd.data.name, cmd);
        commandsJSON.push(cmd.data.toJSON());
        console.log(`✅ Komut yüklendi: ${cmd.data.name}`);
      } else {
        console.warn(`⚠️ Hatalı komut dosyası: ${file}`);
      }
    }
  } else {
    console.warn('⚠️ ./commands klasörü bulunamadı.');
  }
} catch (e) {
  console.error('❌ Komutlar yüklenemedi:', e);
}

// ========== YARDIMCI ==========
function resolveStaffRoleIds(guild) {
  const allRoleNames = [...(config.roles?.ust || []), ...(config.roles?.orta || []), ...(config.roles?.alt || [])];
  const ids = new Set();
  for (const name of allRoleNames) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) ids.add(role.id);
  }
  return [...ids];
}

// ========== BOT AKTİF ==========
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandsJSON });
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }

  // Express ping
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;
  app.get('/', (_req, res) => res.send('✅ Bot çalışıyor.'));
  app.listen(PORT, () => console.log(`🌐 Express port: ${PORT}`));
});

// ========== MODERASYON (küfür / reklam / spam) ==========
const bannedWords = ['salak','aptal','aq','orospu','piç','yarrak','mk'];
const invitePattern = /(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/g;
const spamMap = new Map();

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.toLowerCase();

  if (bannedWords.some(w => content.includes(w))) {
    await message.delete().catch(()=>{});
    return message.channel.send(`${message.author}, küfür yasak!`).then(m => setTimeout(()=>m.delete(), 5000));
  }

  if (invitePattern.test(content)) {
    await message.delete().catch(()=>{});
    return message.channel.send(`${message.author}, davet linki paylaşmak yasak!`).then(m => setTimeout(()=>m.delete(), 5000));
  }

  const now = Date.now();
  const spamData = spamMap.get(message.author.id) || { count: 0, last: 0 };

  if (now - spamData.last < 3000) {
    spamData.count++;
    if (spamData.count > 5) {
      await message.member.timeout(ms('1m'), 'Spam yaptı.').catch(()=>{});
      message.channel.send(`${message.author} 1 dakika susturuldu.`);
      spamData.count = 0;
    }
  } else {
    spamData.count = 1;
  }
  spamData.last = now;
  spamMap.set(message.author.id, spamData);
});

// ========== INTERACTION ==========
client.on(Events.InteractionCreate, async interaction => {
  // Slash komut
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (e) {
      console.error(e);
      return interaction.reply({ content: '❌ Hata oluştu.', ephemeral: true }).catch(()=>{});
    }
  }

  // Butonlar
  if (interaction.isButton()) {
    const id = interaction.customId;
    const staffRoleIds = resolveStaffRoleIds(interaction.guild);

    // Bilet aç
    if (id === 'create_ticket') {
      const existing = interaction.guild.channels.cache.find(c => 
        c.type === ChannelType.GuildText && 
        c.name === `ticket-${interaction.user.id}`
      );
      if (existing) return interaction.reply({ content: `❌ Zaten bir biletin var: ${existing}`, ephemeral: true });

      const ch = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parent,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          ...staffRoleIds.map(rid => ({ id: rid, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }))
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Kapat').setStyle(ButtonStyle.Danger)
      );

      await ch.send({ 
        embeds: [new EmbedBuilder().setTitle('🎫 Destek Talebi').setDescription('Yetkililer yakında sizinle ilgilenecek.').setColor('Blue')],
        components: [row]
      });

      return interaction.reply({ content: `✅ Bilet oluşturuldu: ${ch}`, ephemeral: true });
    }

    // Bilet kapat
    if (id === 'ticket_close') {
      if (!interaction.member.roles.cache.some(r => staffRoleIds.includes(r.id))) 
        return interaction.reply({ content: '❌ Bu butonu sadece yetkililer kullanabilir.', ephemeral: true });
      if (!interaction.channel.name.startsWith('ticket-')) 
        return interaction.reply({ content: '❌ Bu sadece bilet kanallarında geçerli.', ephemeral: true });

      await interaction.reply({ content: '📪 Bilet 5 saniye içinde kapatılacak.', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(()=>{}), 5000);
    }
  }
});

// ========== HATA ==========
process.on('uncaughtException', e => console.error('🚨 Uncaught Exception:', e));
process.on('unhandledRejection', e => console.error('🚨 Unhandled Rejection:', e));

// ========== LOGIN ==========
if (!process.env.TOKEN) {
  console.error('❌ .env içine TOKEN eklemelisin!');
  process.exit(1);
}
client.login(process.env.TOKEN);
