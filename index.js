require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Hata varsa bile bot çökmemesi için:
client.on('error', console.error);
process.on('unhandledRejection', (reason) => {
  console.warn("Unhandled Rejection:", reason.message || reason);
});

client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'kick') {
    const member = interaction.options.getMember('user');
    if (!member.kickable) return interaction.reply({ content: '❌ Bu kullanıcıyı atamam.', ephemeral: true });
    await member.kick();
    await interaction.reply({ content: `${member.user.tag} sunucudan atıldı.`, ephemeral: true });
  }

  if (interaction.commandName === 'ban') {
    const member = interaction.options.getMember('user');
    if (!member.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam.', ephemeral: true });
    await member.ban();
    await interaction.reply({ content: `${member.user.tag} sunucudan banlandı.`, ephemeral: true });
  }
});

client.login(process.env.TOKEN || 'YANLIŞTOKEN'); // Hatalıysa bile çökmemesi için fallback eklendi
