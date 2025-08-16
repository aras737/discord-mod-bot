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

// ========== CLIENT ==========
// Tüm yetkileri ekleyelim ki bot eksiksiz çalışsın
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences, // Üye durumlarını takip etmek için (offline/online)
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration, // Ban ve kick olayları için
  ],
});

// ========== EK SİSTEMLER ==========
// Otomatik moderasyon ve logs sistemlerini içeri al
const otomatikModSystem = require('./otomatikMod.js');
const logsSystem = require('./logs.js');

// ========== KOMUT YÜKLEYİCİ ==========
client.commands = new Collection();
const komutlarJSON = [];
const komutKlasoru = path.join(__dirname, 'komutlar');

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
    console.warn('⚠️ ./komutlar klasörü bulunamadı.');
  }
} catch (e) {
  console.error('❌ Komutlar yüklenemedi:', e);
}

// ========== READY ==========
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  // Slash komutları kaydet
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

  // Express
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
    // --------- BUTONLAR: BİLET SİSTEMİ ---------
    if (interaction.isButton()) {
      const id = interaction.customId;

      const staffRoleIds = (config.roles?.ust || []).map(roleName => interaction.guild.roles.cache.find(r => r.name === roleName)?.id).filter(Boolean);

      // Bilet aç
      if (id === 'create_ticket') {
        const existing = interaction.guild.channels.cache.find(c =>
            c.type === ChannelType.GuildText &&
            c.name.startsWith(`ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`)
        );
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
            ...staffRoleIds.map(rid => ({
              id: rid,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            }))
          ]
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Kapat').setStyle(ButtonStyle.Danger),
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
        return;
      }
      
      // Bilet kapat
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

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error('interactionCreate hata:', err);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Komutu çalıştırırken bir hata oluştu!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Komutu çalıştırırken bir hata oluştu!', ephemeral: true });
        }
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
