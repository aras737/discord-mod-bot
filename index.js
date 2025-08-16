// ========== ÇEKİRDEK ==========
const {
  Client, GatewayIntentBits, Collection, REST, Routes,
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, EmbedBuilder, AttachmentBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle
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

// ========== HAZIRLIK VE GİRİŞ ==========
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

  // Express
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;
  app.get('/', (_req, res) => res.send('✅ Bot çalışıyor.'));
  app.listen(PORT, () => {
    console.log(`🌐 Express portu dinleniyor: ${PORT}`);
  });
});

// ========== LOGS SİSTEMİ ==========
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (oldState.channelId === newState.channelId) return;
    const logChannel = client.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    if (oldState.channelId && !newState.channelId) {
        logChannel.send(`🔴 ${oldState.member.displayName} ses kanalından ayrıldı: **${oldState.channel.name}**`);
    } else if (!oldState.channelId && newState.channelId) {
        logChannel.send(`🟢 ${newState.member.displayName} ses kanalına katıldı: **${newState.channel.name}**`);
    } else {
        logChannel.send(`🔵 ${newState.member.displayName} ses kanalını değiştirdi: **${oldState.channel.name}** --> **${newState.channel.name}**`);
    }
});

// ========== OTOMATİK MODERASYON ==========
const bannedWords = ['salak', 'aptal', 'aq', 'orospu', 'piç', 'yarrak', 'mk'];
const invitePattern = /(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/g;
const spamMap = new Map();

client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;

    const messageContent = message.content.toLowerCase();

    // Küfür kontrolü
    if (bannedWords.some(word => messageContent.includes(word))) {
        await message.delete();
        message.channel.send(`Hey, ${message.author}! Bu kanalda bu kelimeleri kullanmak yasaktır.`).then(msg => setTimeout(() => msg.delete(), 5000));
        return;
    }

    // Reklam kontrolü
    if (invitePattern.test(messageContent)) {
        await message.delete();
        message.channel.send(`Hey, ${message.author}! Başka bir sunucuya davet bağlantısı paylaşmak yasaktır.`).then(msg => setTimeout(() => msg.delete(), 5000));
        return;
    }

    // Spam kontrolü
    const now = Date.now();
    const userSpam = spamMap.get(message.author.id) || { count: 0, lastMessage: 0 };

    if (now - userSpam.lastMessage < 3000) {
        userSpam.count++;
        if (userSpam.count > 5) {
            await message.member.timeout(ms('1m'), 'Spam yapıyor.');
            message.channel.send(`${message.author} spam yaptığı için 1 dakika susturuldu.`);
            userSpam.count = 0;
        }
    } else {
        userSpam.count = 1;
    }
    userSpam.lastMessage = now;
    spamMap.set(message.author.id, userSpam);
});

// ========== INTERACTION (TÜM KOMUT VE BUTONLARI YÖNETİR) ==========
client.on(Events.InteractionCreate, async (interaction) => {
    // Slash komutları
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            console.error('Komut çalıştırma hatası:', err);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Komutu çalıştırırken bir hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Komutu çalıştırırken bir hata oluştu!', ephemeral: true });
            }
        }
    }

    // Buton etkileşimleri
    if (interaction.isButton()) {
        const id = interaction.customId;
        const staffRoleIds = resolveStaffRoleIds(interaction.guild);

        // Bilet oluşturma butonu (ticket sistemi)
        if (id === 'create_ticket') {
            const existing = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name.startsWith(`ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`));
            if (existing) return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${existing}`, ephemeral: true });

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

        // Bilet kapatma butonu
        if (id === 'ticket_close') {
            if (!interaction.member.roles.cache.some(r => staffRoleIds.includes(r.id))) return interaction.reply({ content: 'Bu butonu sadece yetkililer kullanabilir.', ephemeral: true });
            if (!interaction.channel.name.startsWith('ticket-')) return interaction.reply({ content: 'Bu işlem sadece bilet kanallarında yapılabilir.', ephemeral: true });
            await interaction.reply({ content: 'Bilet 5 saniye içinde kapatılacak.', ephemeral: true });
            setTimeout(() => interaction.channel.delete(), 5000);
            return;
        }
    }

    // Modal gönderme (başvuru formu için)
    if (interaction.isModalSubmit() && interaction.customId === 'kamp_basvuru_formu') {
        const robloxIsim = interaction.fields.getTextInputValue('robloxIsim');
        const discordIsim = interaction.fields.getTextInputValue('discordIsim');
        const kamplar = interaction.fields.getTextInputValue('gelinenKamplar');
        const grupUyeSayilari = interaction.fields.getTextInputValue('grupUyeSayilari');
        const tkaDurum = interaction.fields.getTextInputValue('tkaDurumu');
        const robloxGrupUyeligi = interaction.fields.getTextInputValue('robloxGrupUyeligi');
        const ssKanit = interaction.fields.getTextInputValue('ssKanit');

        const resultEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📝 Yeni Kamp Başvurusu')
            .setDescription(`**Başvuran:** <@${interaction.user.id}> (${interaction.user.tag})`)
            .addFields(
                { name: 'Roblox İsmi', value: robloxIsim, inline: true },
                { name: 'Discord İsmi', value: discordIsim, inline: true },
                { name: 'Geldiği Kamplar', value: kamplar },
                { name: 'Grup Üye Sayıları', value: grupUyeSayilari },
                { name: 'Daha Önce TKA Ordusunda Bulundu mu?', value: tkaDurum },
                { name: 'Roblox Grup Üyeliği', value: robloxGrupUyeligi },
                { name: 'SS/Kanıt', value: ssKanit }
            )
            .setTimestamp();
        
        const logChannelId = 'BASVURU_LOG_KANAL_IDSI';
        try {
            const logChannel = await interaction.guild.channels.fetch(logChannelId);
            if (logChannel) {
                await logChannel.send({ embeds: [resultEmbed] });
                await interaction.reply({ content: 'Başvurunuz başarıyla gönderildi!', ephemeral: true });
            } else {
                 await interaction.reply({ content: `❌ Başvuru kanalı bulunamadı. Lütfen "BASVURU_LOG_KANAL_IDSI" değerini doğru girdiğinizden emin olun.`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Başvurunuz gönderilirken bir hata oluştu.', ephemeral: true });
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
