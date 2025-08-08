const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cekilis')
    .setDescription('Bir çekiliş başlatır.')
    .addIntegerOption(option =>
      option.setName('sure')
        .setDescription('Çekiliş süresi (saniye)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('odul')
        .setDescription('Çekiliş ödülü')
        .setRequired(true)),

  async execute(interaction) {
    const sure = interaction.options.getInteger('sure');
    const odul = interaction.options.getString('odul');

    const mesaj = await interaction.reply({
      content: `🎉 **Çekiliş Başladı!**\n🎁 Ödül: ${odul}\n⏳ Süre: ${sure} saniye\nKatılmak için 🎉 tepkisine tıkla!`,
      fetchReply: true
    });

    await mesaj.react('🎉');

    setTimeout(async () => {
      const guncelMesaj = await interaction.channel.messages.fetch(mesaj.id);
      const tepkiler = guncelMesaj.reactions.cache.get('🎉');

      if (!tepkiler) return interaction.followUp('❌ Kimse katılmadı.');

      const katilanlar = await tepkiler.users.fetch();
      const filtrelenmis = katilanlar.filter(u => !u.bot);
      const kazanan = filtrelenmis.random();

      if (kazanan) {
        interaction.followUp(`🎉 Tebrikler ${kazanan}! **${odul}** ödülünü kazandın!`);
      } else {
        interaction.followUp('❌ Kimse kazanamadı.');
      }
    }, sure * 1000);
  }
};
