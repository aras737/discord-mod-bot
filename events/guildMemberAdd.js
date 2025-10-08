// Kullanıcı Katıldığında Mesaj atar

// Bu, bir Discord.js v14 (ve üzeri) event dinleyicisi örneğidir
module.exports = {
    name: 'guildMemberAdd',
    execute(member) {
        // Kanalı ID veya isim ile bulabilirsiniz.
        const channel = member.guild.channels.cache.find(ch => ch.name === 'hoşgeldin');

        if (!channel) return; // 'hoşgeldin' kanalı yoksa dur.

        // Mesajı gönder
        channel.send(`Sunucumuza hoş geldin, ${member.user.tag}! 🎉`);
    },
};
