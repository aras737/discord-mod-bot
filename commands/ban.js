const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar ve DM ile bilgi verir.')
    .addUserOption(option => option.setName('kullanici').setDescription('Banlanacak kişi').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Ban sebebi').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep');

    try {
      await user.send(`🚫 Sunucudan banlandınız.\n**Sebep:** ${reason}`);
    } catch {}

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member) await member.ban({ reason });

    await interaction.reply({ content: `✅ ${user.tag} başarıyla banlandı.`, ephemeral: true });
  }
};
