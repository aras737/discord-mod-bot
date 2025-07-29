const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const warns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Bir kullanıcıyı uyarır.')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('sebep').setDescription('Uyarı sebebi').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const reason = interaction.options.getString('sebep');
    
    if (!warns.has(user.id)) warns.set(user.id, []);
    warns.get(user.id).push(reason);

    interaction.reply(`${user} uyarıldı: ${reason}`);
  }
};
