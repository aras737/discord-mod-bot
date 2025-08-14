// index.js
const {
  Client, GatewayIntentBits, Collection, REST, Routes,
  PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType
} = require('discord.js');
const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config.json'); // roller/komutlar burada

// ----------------------- CLIENT -----------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ----------------------- KOMUT YÜKLE -----------------------
client.commands = new Collection();
const komutlar = [];
const komutKlasoru = './commands';

try {
  const dosyalar = fs.readdirSync(komutKlasoru).filter(f => f.endsWith('.js'));
  for (const file of dosyalar) {
    const command = require(`${komutKlasoru}/${file}`);
    if (command?.data && typeof command.execute === 'function') {
      client.commands.set(command.data.name, command);
      komutlar.push(command.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Hatalı komut dosyası: ${file}`);
    }
  }
} catch (e) {
  console.error('❌ Komutlar yüklenemedi:', e);
}

// ----------------------- YARDIMCI -----------------------
const rastgeleIsim = () => {
  const kelimeler = ['zephyr','nova','orbit','pulse','quantum','vortex','storm','ember','echo'];
  return `ticket-${kelimeler[Math.floor(Math.random()*kelimeler.length)]}-${Math.floor(Math.random()*1000)}`;
};

function kullaniciSeviye(member) {
  const adlar = member.roles.cache.map(r => r.name);
  if (config.roles?.ust?.some(n => adlar.includes(n))) return 'ust';
  if (config.roles?.orta?.some(n => adlar.includes(n))) return 'orta';
  if (config.roles?.alt?.some(n => adlar.includes(n))) return 'alt';
  if (config.roles?.masum?.some(n => adlar.includes(n))) return 'masum';
  return null;
}

// ----------------------- READY -----------------------
client.once('ready', async () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);

  // ÜST rütbeye tüm komutlar otomatik verilsin
  config.commands = config.commands || {};
  config.commands.ust = Array.from(client.commands.keys());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: komutlar });
    console.log('✅ Slash komutlar yüklendi.');
  } catch (err) {
    console.error('❌ Slash komut yükleme hatası:', err);
  }
});

// ----------------------- INTERACTION (TEK EVENT!) -----------------------
client.on('interactionCreate', async (interaction) => {
  try {
    // --------- BUTONLAR (Ticket) ---------
    if (interaction.isButton()) {
      // Bilet aç
      if (interaction.customId === 'ticket-olustur') {
        const zaten = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
        if (zaten) return interaction.reply({ content: `❌ Zaten açık bir biletin var: ${zaten}`, ephemeral: true });

        const kanal = await interaction.guild.channels.create({
          name: rastgeleIsim(),
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          ],
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket-kapat').setLabel('❌ Bileti Kapat').setStyle(ButtonStyle.Danger)
        );

        await kanal.send({ content: `${interaction.user}, destek talebin açıldı.`, components: [row] });
        return interaction.reply({ content: `✅ Bilet açıldı: ${kanal}`, ephemeral: true });
      }

      // Bilet kapat
      if (interaction.customId === 'ticket-kapat') {
        await interaction.reply({ content: '📪 Bilet kapatılıyor...', ephemeral: true });
        return interaction.channel.delete().catch(() => {});
      }

      return; // başka buton yok
    }

    // --------- SLASH KOMUTLAR ---------
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      // Komut bulunamadıysa bile yanıt ver
      return interaction.reply({ content: '❌ Komut bulunamadı.', ephemeral: true }).catch(() => {});
    }

    // Otomatik defer (2 sn içinde yanıt/defer gelmezse time-out engeli)
    let autoDeferred = false;
    const guard = setTimeout(async () => {
      if (!interaction.deferred && !interaction.replied) {
        autoDeferred = true;
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
      }
    }, 2000);

    // Yetki kontrol (Owner ve UST her şeye erişir)
    const owner = interaction.guild?.ownerId === interaction.user.id;
    const seviye = kullaniciSeviye(interaction.member);
    const ust = seviye === 'ust';

    if (!owner && !ust) {
      const izinli = (config.commands?.[seviye] || []).includes(interaction.commandName);
      if (!izinli) {
        clearTimeout(guard);
        return interaction.reply({ content: '🚫 Bu komut senin yetki seviyene kapalı.', ephemeral: true }).catch(() => {});
      }
    }

    // Komutu çalıştır
    await command.execute(interaction);

    // Komut hiç yanıt vermediyse güvenli bitiriş
    clearTimeout(guard);
    if (autoDeferred && !interaction.replied) {
      await interaction.editReply('✅ Komut çalıştırıldı.').catch(() => {});
    }

  } catch (err) {
    console.error('❌ interactionCreate hata:', err);
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
      } else {
        await interaction.followUp({ content: '❌ Bir hata oluştu.', ephemeral: true });
      }
    } catch {}
  }
});

// ----------------------- MESAJ FİLTRESİ -----------------------
client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  const kufurler = ['salak','aptal','malamk','aq','orospu','sik','piç','anan','yarrak','mk'];
  if (kufurler.some(k => message.content.toLowerCase().includes(k))) {
    message.delete().catch(() => {});
    message.channel.send('🚫 Bu sunucuda küfür yasaktır!').catch(() => {});
  }
});

// ----------------------- EXPRESS (opsiyonel ping) -----------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('✅ Bot çalışıyor.'));
app.listen(PORT, () => console.log(`🌐 Express portu dinleniyor: ${PORT}`));

// ----------------------- LOGIN -----------------------
client.login(process.env.TOKEN);
