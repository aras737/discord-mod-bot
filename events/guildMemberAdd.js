const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member, client) {
    const banData = await client.db.get(`globalban.${member.id}`);
    if (!banData) return;

    try {
      await member.send(
        `🚫 **GLOBAL BAN**\nBu sunucuya giremezsin.\nSebep: **${banData.sebep}**`
      );
    } catch {}

    await member.ban({
      reason: `GLOBAL BAN | ${banData.sebep}`
    });
  }
};
