# discord-mod-bot
await rest.put(
  Routes.applicationCommands(client.user.id),
  { body: commands }
);

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

const TOKEN = process.env.TOKEN;

client.on('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.content === '!ping') return msg.reply('🏓 Pong!');
  if (msg.content.startsWith('!kick')) {
    if (!msg.member.permissions.has("KickMembers")) return msg.reply("❌ Yetkin yok.");
    const user = msg.mentions.members.first();
    if (!user) return msg.reply("Birini etiketle!");
    user.kick().then(() => msg.reply(`${user.user.tag} atıldı.`));
  }
  if (msg.content.startsWith('!ban')) {
    if (!msg.member.permissions.has("BanMembers")) return msg.reply("❌ Yetkin yok.");
    const user = msg.mentions.members.first();
    if (!user) return msg.reply("Birini etiketle!");
    user.ban().then(() => msg.reply(`${user.user.tag} banlandı.`));
  }
});

client.login(TOKEN);
