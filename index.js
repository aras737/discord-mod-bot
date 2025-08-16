// ========== ÇEKİRDEK ==========
const {
  Client, GatewayIntentBits, Collection, REST, Routes,
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, EmbedBuilder, AttachmentBuilder, Events
} = require('discord.js');

const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config.json');

// ========== EK SİSTEMLERİMİZİ ÇAĞIR ==========
const otomatikModSystem = require('./otomatikMod.js');
const logsSystem = require('./logs.js');
const { setupModalListener } = require('./commands/kampBasvuru.js');

// ========== CLIENT ==========
// Tüm yetkileri ekleyelim ki bot eksiksiz çalışsın
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
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
      const filePath = path.join(komutKlasoru, f);
      const cmd = require(filePath);
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

// ========== YARDIMCI FONKSİYONLAR ==========
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

function resolveStaffRoleIds(guild) {
  const allRoleNames = [...(config.roles?.ust || []), ...(config.roles?.orta || []), ...(config.roles?.alt || [])];
  const ids = new Set();
  for (const name of allRoleNames) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) ids.add(role.id);
  }
  return [...ids];
}

// ========== READY ==========
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  config.commands = config.commands || {};
  config.commands.ust = Array.from(client.commands.keys());

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlarJSON });
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }

  // Önceki sistemleri başlat
  otomatikModSystem(client);
  logsSystem(client);
  setupModalListener(client);

  const app = express();
  const PORT = Number(process.env.PORT) || 8080;
  app.get('/', (_req, res) => res.send('✅ Bot çalışıyor.'));
  app.listen(PORT, () => {
    console.log(`🌐 Express portu dinleniyor: ${PORT}`);
    if (process.env.WEB_BASE_URL) {
      console.log(`🌍 WEB_BASE_URL: ${process.env.WEB_BASE_URL}`);
    }
  });
});

// ========== INTERACTION (TEK NOKTA) ==========
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // --------- BUTONLAR ---------
    if (interaction.isButton()) {
        const id = interaction.customId;
        const staffRoleIds = resolveStaffRoleIds(interaction.guild);
        
        // Bilet oluşturma
        if (id === 'create_ticket') {
            const existing = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name.startsWith(`ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`));
            if (existing) {
                return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${existing}`, ephemeral: true });
            }

            const ch = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                type: ChannelType.GuildText,
                parent: interaction.channel.parent,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                    ...staffRoleIds.map(rid => ({ id: rid, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }))
                ]
            });

            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Kapat').setStyle(ButtonStyle.Danger));
            await ch.send({ embeds: [new EmbedBuilder().setTitle('🎫 Destek Talebi').setDescription('Merhaba! Sorununu/isteğini detaylı yaz. Yetkililer kısa sürede yardımcı olacak.').setColor('Blue').setFooter({ text: `Açan: ${interaction.user.tag}` }).setTimestamp()], components: [row] });
            await interaction.reply({ content: `✅ Bilet oluşturuldu: ${ch}`, ephemeral: true });
            return;
        }

        // Bilet kapatma
        if (id === 'ticket_close') {
            if (!interaction.member.roles.cache.some(r => staffRoleIds.includes(r.id))) {
                return interaction.reply({ content: 'Bu butonu sadece yetkililer kullanabilir.', ephemeral: true });
            }
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: 'Bu işlem sadece bilet kanallarında yapılabilir.', ephemeral: true });
            }
            await interaction.reply({ content: 'Bilet 5 saniye içinde kapatılacak.', ephemeral: true });
            setTimeout(() => interaction.channel.delete(), 5000);
            return;
        }
    }

    // --------- SLASH KOMUTLAR ---------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const seviye = getSeviye(interaction.member);
      if (interaction.guild && interaction.guild.ownerId !== interaction.user.id) {
          if (!seviye) {
              return interaction.reply({ content: '🚫 Bu komutu kullanmak için yetkin yok.', ephemeral: true });
          }
          if (seviye !== 'ust') {
              const izinli = (config.commands?.[seviye] || []).includes(interaction.commandName);
              if (!izinli) {
                  return interaction.reply({ content: '🚫 Bu komut senin yetki seviyene kapalı.', ephemeral: true });
              }
          }
      }

      await command.execute(interaction);
    }
    
    // --------- MODAL GÖNDERİMİ (ModalSubmitInteraction) ---------
    if (interaction.isModalSubmit()) {
        const modalListener = client.listeners(Events.InteractionCreate).find(listener => listener.name === 'modalSubmitListener');
        if (modalListener) {
            await modalListener(interaction);
        }
    }
  } catch (err) {
    console.error('interactionCreate hata:', err);
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true }).catch(() => {});
    }
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
