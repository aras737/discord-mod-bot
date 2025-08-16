const { Events } = require('discord.js');
const ms = require('ms');

module.exports = (client) => {
    const bannedWords = ['küfür1', 'küfür2', 'yasaklı_kelime'];
    const invitePattern = /(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/g;

    client.on(Events.MessageCreate, async message => {
        if (message.author.bot || !message.guild) return;

        const messageContent = message.content.toLowerCase();

        const containsBannedWord = bannedWords.some(word => messageContent.includes(word));
        if (containsBannedWord) {
            await message.delete();
            message.channel.send(`Hey, ${message.author}! Bu kanalda bu kelimeleri kullanmak yasaktır.`)
                .then(msg => setTimeout(() => msg.delete(), 5000));
            return;
        }

        const containsInvite = invitePattern.test(messageContent);
        if (containsInvite) {
            await message.delete();
            message.channel.send(`Hey, ${message.author}! Başka bir sunucuya davet bağlantısı paylaşmak yasaktır.`)
                .then(msg => setTimeout(() => msg.delete(), 5000));
            return;
        }

        const now = Date.now();
        const spamMap = client.spamMap || (client.spamMap = new Map());
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
};
