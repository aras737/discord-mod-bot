module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const kanal = member.guild.systemChannel;
    if (kanal) {
      kanal.send(`👋 ${member.user.tag} sunucudan ayrıldı.`);
    }
  }
};
