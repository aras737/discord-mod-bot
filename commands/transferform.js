const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('Transfer-Form')
        .setDescription('Kampa katılım başvuru formunu gönderir.'),
    async execute(interaction) {
        const formText = `**• Roblox İsminiz:**

**• Roblox isim:•**

**• Discord İsminiz:**

**• Hangi kamplardan geliyorsunuz: [HEPSİNİ SAY]**

**• Geldiğiniz kampların grup üyesi sayıları: [HEPSİNİ SAY]**

**• Daha önce TKA ordusunda bulundunuz mu:**

**• Kampların Roblox grubunda yer alıyor musunuz:**

**• SS/Kanıt: [Her kamp için iki tane  oyun içi SS gerekmektedir. Bu, sizin kamptan hemen girip hemen çıkmadığınızı anlamamız için getirilen bir kuraldır. İki SS'in de farklı günlerde olması  gerekmektedir.]**`;

        await interaction.reply({ content: formText });
    },
};
