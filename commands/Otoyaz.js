const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yaz')
        .setDescription('Belirli aralıklarla seçilen kişiye yazmasını söyler.')
        .addUserOption(option =>
            option.setName('kisi')
                .setDescription('Yazmasını istediğin kişi')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('kacsaniyede_bir')
                .setDescription('Kaç saniyede bir yazsın')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('neyazacak')
                .setDescription('Ne yazsın')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('kisi');
        const interval = interaction.options.getInteger('kacsaniyede_bir');
        const text = interaction.options.getString('neyazacak');

        await interaction.reply({
            content: `🔁 ${user} her **${interval} saniyede bir** "${text}" yazacak şekilde bilgilendiriliyor.`,
        });

        const channel = interaction.channel;

        const intervalId = setInterval(() => {
            channel.send(`${user}, şimdi **"${text}"** yaz! 💬`);
        }, interval * 1000);

        // 1 dakika sonra otomatik durdur
        setTimeout(() => {
            clearInterval(intervalId);
            channel.send(`✅ ${user} için yaz hatırlatması sona erdi.`);
        }, 60000);
    }
};
