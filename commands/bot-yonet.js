const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-yonet')
    .setDescription('Botun ayarlarını yönet.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('isim')
        .setDescription('Botun ismini değiştir.')
        .addStringOption(option =>
          option.setName('yeni_isim')
            .setDescription('Yeni bot ismi')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('durum')
        .setDescription('Botun durumunu değiştir.')
        .addStringOption(option =>
          option.setName('tur')
            .setDescription('Durum türü')
            .setRequired(true)
            .addChoices(
              { name: 'Oynuyor', value: 'PLAYING' },
              { name: 'Dinliyor', value: 'LISTENING' },
              { name: 'Yayınlıyor', value: 'STREAMING' },
              { name: 'Yazıyor', value: 'WATCHING' }
            ))
        .addStringOption(option =>
          option.setName('durum')
            .setDescription('Durum metni')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('avatar')
        .setDescription('Botun avatarını değiştir. (URL)')
        .addStringOption(option =>
          option.setName('url')
            .setDescription('Yeni avatar URL')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('restart')
        .setDescription('Botu yeniden başlat.')),

  async execute(interaction) {
    const { client } = interaction;

    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'Bu komutu kullanmak için yönetici olmalısın.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'isim') {
      const yeniIsim = interaction.options.getString('yeni_isim');
      try {
        await client.user.setUsername(yeniIsim);
        return interaction.reply({ content: `Bot ismi başarıyla "${yeniIsim}" olarak değiştirildi.` });
      } catch (error) {
        return interaction.reply({ content: 'Bot ismi değiştirilemedi. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
      }
    }

    if (subcommand === 'durum') {
      const tur = interaction.options.getString('tur');
      const durum = interaction.options.getString('durum');

      try {
        if (tur === 'STREAMING') {
          // Yayın URL'si gerekli, bunu sabit bir URL olarak ekleyelim:
          await client.user.setActivity(durum, { type: tur, url: 'https://twitch.tv/username' });
        } else {
          await client.user.setActivity(durum, { type: tur });
        }
        return interaction.reply({ content: `Bot durumu başarıyla "${tur.toLowerCase()}" olarak ayarlandı: ${durum}` });
      } catch (error) {
        return interaction.reply({ content: 'Durum değiştirilemedi. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
      }
    }

    if (subcommand === 'avatar') {
      const url = interaction.options.getString('url');
      try {
        await client.user.setAvatar(url);
        return interaction.reply({ content: 'Bot avatarı başarıyla değiştirildi.' });
      } catch (error) {
        return interaction.reply({ content: 'Avatar değiştirilemedi. Geçerli bir URL olduğundan emin olun.', ephemeral: true });
      }
    }

    if (subcommand === 'restart') {
      await interaction.reply({ content: 'Bot yeniden başlatılıyor...' });
      process.exit(0); // Botu kapatıp tekrar başlat (örneğin pm2, Docker vs ile otomatik açılır)
    }
  }
};
