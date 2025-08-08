module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const kanal = member.guild.systemChannel; // sistem kanalına gönder
    if (kanal) {
      kanal.send(`👋 Hoş geldin ${member.user.tag}!`);
    }
  }
};
