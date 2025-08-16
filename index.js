// ========== ÇEKİRDEK ==========
const {
  Client, GatewayIntentBits, Collection, REST, Routes,
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, EmbedBuilder, AttachmentBuilder
} = require('discord.js');

const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config.json');

// ========== CLIENT ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// ========== KOMUT YÜKLEYİCİ ==========
client.commands = new Collection();
const komutlarJSON = [];
const komutKlasoru = path.join(__dirname, 'commands');

try {
  if (fs.existsSync(komutKlasoru)) {
    const dosyalar = fs.readdirSync(komutKlasoru).filter(f => f.endsWith('.js'));
    for (const f of dosyalar) {
      const cmd = require(path.join(komutKlasoru, f));
      if (cmd?.data && cmd?.execute) {
        client.commands.set(cmd.data.name, cmd);
        komutlarJSON.push(cmd.data.toJSON());
        console.log(`✅ Komut yüklendi: ${cmd.data.name}`);
      } else {
        console.warn(`⚠️ Hatalı komut dosyası: ${f}`);
      }
    }
  } else {
    console.warn('⚠️ ./commands klasörü bulunamadı.');
  }
} catch (e) {
  console.error('❌ Komutlar yüklenemedi:', e);
}

// ========== YARDIMCI: RÜTBE TESPİTİ ==========
function getSeviye(member) {
  const names = member.roles.cache.map(r => r.name);

  const ust = (config.roles?.ust || []).some(n => names.includes(n));
  if (ust) return 'ust';

  const orta = (config.roles?.orta || []).some(n => names.includes(n));
  if (orta) return 'orta';

  const alt = (config.roles?.alt || []).some(n => names.includes(n));
  if (alt) return 'alt';

  const masum = (config.roles?.masum || []).some(n => names.includes(n));
  if (masum) return 'masum';

  return null;
}

// ========== YARDIMCI: ROL İSİMLERİNİ ID'YE ÇEVİR ==========
function resolveStaffRoleIds(guild) {
  const allRoleNames = [
    ...(config.roles?.ust || []),
    ...(config.roles?.orta || []),
    ...(config.roles?.alt || [])
  ];

  const ids = new Set();
  for (const name of allRoleNames) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) ids.add(role.id);
  }
  return [...ids];
}

// ========== READY ==========
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  // “üst”e tüm komutları otomatik ver (runtime)
  config.commands = config.commands || {};
  config.commands.ust = Array.from(client.commands.keys());

  // Slash komutları kaydet
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlarJSON });
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }

  // Express
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;
  app.get('/', (_req, res) => res.send('✅ Bot çalışıyor.'));
  app.listen(PORT, () => {
    console.log(`🌐 Express portu dinleniyor: ${PORT}`);
    console.log(`📌 Yönetim paneli: http://localhost:${PORT}/panel`);
    if (process.env.WEB_BASE_URL) {
      console.log(`🌍 WEB_BASE_URL: ${process.env.WEB_BASE_URL}`);
    }
  });
});

// ========== INTERACTION (TEK NOKTA) ==========
client.on('interactionCreate', async (interaction) => {
  try {
    // --------- BUTONLAR: BİLET SİSTEMİ ---------
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Bilet aç
      if (id === 'ticket_open') {
        const staffRoleIds = resolveStaffRoleIds(interaction.guild);

        // Kategori
        let parent = null;
        if (process.env.TICKET_CATEGORY_ID) {
          parent = interaction.guild.channels.cache.get(process.env.TICKET_CATEGORY_ID) || null;
        }

        // Aynı kullanıcı için açık ticket var mı? (İsim bazlı)
        const existing = interaction.guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText &&
          c.name.startsWith(`ticket-${interaction.user.id}`)
        );
        if (existing) {
          return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${existing}`, ephemeral: true });
        }

        // Kanal oluştur
        const ch = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}-${Math.floor(Math.random() * 999)}`,
          type: ChannelType.GuildText,
          parent,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ReadMessageHistory] },
            ...staffRoleIds.map(rid => ({
              id: rid,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            }))
          ]
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_lock').setLabel('🔒 Kilitle').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ticket_unlock').setLabel('🔓 Aç').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ticket_transcript').setLabel('📁 Transkript').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('ticket_close').setLabel('🧹 Kapat').setStyle(ButtonStyle.Danger),
        );

        await ch.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('🎫 Destek Talebi')
              .setDescription('Merhaba! Sorununu/isteğini detaylı yaz. Yetkililer kısa sürede yardımcı olacak.')
              .setColor('Blue')
              .setFooter({ text: `Açan: ${interaction.user.tag}` })
              .setTimestamp()
          ],
          components: [row]
        });

        await interaction.reply({ content: `✅ Bilet oluşturuldu: ${ch}`, ephemeral: true });
        // Log
        if (config.logChannelId) {
          const logCh = interaction.guild.channels.cache.get(config.logChannelId);
          logCh?.send({ content: `🟢 **Ticket Açıldı:** ${ch} | Açan: ${interaction.user.tag}` });
        }
        return;
      }

      // Bilet kilitle
      if (id === 'ticket_lock') {
        if (!interaction.channel?.name.startsWith('ticket-')) {
          return interaction.reply({ content: '❌ Bu komut sadece bilet kanallarında.', ephemeral: true });
        }
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false }).catch(() => {});
        await interaction.reply({ content: '🔒 Bilet kilitlendi (sen mesaj atamazsın).', ephemeral: true });
        return;
      }

      // Bilet aç (kilidi kaldır)
      if (id === 'ticket_unlock') {
        if (!interaction.channel?.name.startsWith('ticket-')) {
          return interaction.reply({ content: '❌ Bu komut sadece bilet kanallarında.', ephemeral: true });
        }
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true }).catch(() => {});
        await interaction.reply({ content: '🔓 Bilet tekrar yazışmaya açıldı.', ephemeral: true });
        return;
      }

      // Transkript
      if (id === 'ticket_transcript') {
        if (!interaction.channel?.name.startsWith('ticket-')) {
          return interaction.reply({ content: '❌ Bu komut sadece bilet kanallarında.', ephemeral: true });
        }
        const msgs = await interaction.channel.messages.fetch({ limit: 100 });
        const sorted = [...msgs.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        const lines = sorted.map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.cleanContent || '(ekli/boş)'}`);
        const buf = Buffer.from(lines.join('\n'), 'utf8');
        const file = new AttachmentBuilder(buf, { name: `${interaction.channel.name}-transcript.txt` });

        await interaction.reply({ content: '📁 Transkript hazırlandı.', files: [file], ephemeral: true });
        if (config.logChannelId) {
          const logCh = interaction.guild.channels.cache.get(config.logChannelId);
          logCh?.send({ content: `📁 **Transkript:** ${interaction.channel.name}`, files: [file] });
        }
        return;
      }

      // Bilet kapat
      if (id === 'ticket_close') {
        if (!interaction.channel?.name.startsWith('ticket-')) {
          return interaction.reply({ content: '❌ Bu komut sadece bilet kanallarında.', ephemeral: true });
        }
        await interaction.reply({ content: '🧹 Bilet 3 saniye içinde kapanacak...', ephemeral: true }).catch(() => {});
        if (config.logChannelId) {
          const logCh = interaction.guild.channels.cache.get(config.logChannelId);
          logCh?.send({ content: `🔴 **Ticket Kapatıldı:** ${interaction.channel.name} | Kapatan: ${interaction.user.tag}` });
        }
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        return;
      }
    }

    // --------- SLASH KOMUTLAR ---------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Sunucu sahibi bypass
      if (interaction.guild && interaction.guild.ownerId === interaction.user.id) {
        return command.execute(interaction);
      }

      // Rütbe tespiti
      const seviye = getSeviye(interaction.member);
      if (!seviye) {
        return interaction.reply({ content: '🚫 Bu komutu kullanmak için yetkin yok.', ephemeral: true });
      }

      // “üst” → tüm komutlara erişim
      if (seviye !== 'ust') {
        const izinli = (config.commands?.[seviye] || []).includes(interaction.commandName);
        if (!izinli) {
          return interaction.reply({ content: '🚫 Bu komut senin yetki seviyene kapalı.', ephemeral: true });
        }
      }

      await command.execute(interaction);
    }
  } catch (err) {
    console.error('interactionCreate hata:', err);
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true }).catch(() => {});
    }
  }
});

// ========== MESAJ FİLTRESİ (opsiyonel) ==========
client.on('messageCreate', (message) => {
  if (!message.guild || message.author.bot) return;
  const kufurler = ['salak','aptal','aq','orospu','piç','yarrak','mk']; // ister genişlet
  if (kufurler.some(k => message.content.toLowerCase().includes(k))) {
    message.delete().catch(() => {});
    message.channel.send('🚫 Bu sunucuda küfür yasaktır!').catch(() => {});
  }
});

// ========== HATA YAKALAMA ==========
process.on('uncaughtException', e => console.error('🚨 Uncaught Exception:', e));
process.on('unhandledRejection', e => console.error('🚨 Unhandled Rejection:', e));

// ========== GİRİŞ ==========
if (!process.env.TOKEN) {
  console.error('❌ .env içine TOKEN koymalısın!');
  process.exit(1);
}
client.login(process.env.TOKEN);
