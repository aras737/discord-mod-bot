const { SlashCommandBuilder } = require('discord.js');
const warns = new Map(); // Aynı veriyi yukarıdaki warn.js ile paylaşmalı (gerçekte bir veritabanı önerilir)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Kullanıcının tüm uyarılarını gösterir.')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Uyarıları görüntülenecek kullanıcı').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const userWarns = warns.get(user.id);

    if (!userWarns || userWarns.length === 0) {
      interaction.reply(`${user} için uyarı bulunamadı.`);
    } else {
      const warnList = userWarns.map((warn, index) => `${index + 1}. ${warn}`).join('\n');
      interaction.reply(`${user} için uyarılar:\n${warnList}`);
    }
  }
};
