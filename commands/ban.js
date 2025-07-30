const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

// Banlanan kullanıcıları tutan basit liste (sadece örnek, bot yeniden başlatılırsa kaybolur)
const bannedUsers = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar.')
    .addUserOption((option) =>
      option.setName('kullanici').setDescription('Banlanacak kullanıcı').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('sebep').setDescription('Ban sebebi').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

    if (!user) return interaction.reply({ content: 'Lütfen geçerli bir kullanıcı seçin.', ephemeral: true });

    // Ban işlemi onayı için select menu oluştur (sebep seçmek gibi)
    const reasons = [
      { label: 'Kural ihlali', value: 'Kural ihlali' },
      { label: 'Spam', value: 'Spam' },
      { label: 'Trolling', value: 'Trolling' },
      { label: 'Diğer', value: 'Diğer' },
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`ban_confirm_${user.id}`)
      .setPlaceholder('Ban sebebini seçiniz')
      .addOptions(reasons);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: `Banlamak istediğiniz kullanıcı: ${user.tag}\nSebebi seçiniz:`,
      components: [row],
      ephemeral: true,
    });
  },

  // Banned users listesine erişim için export edilebilir
  bannedUsers,
};
