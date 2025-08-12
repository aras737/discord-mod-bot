const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require('discord.js');

function rastgeleIsim() {
  const kelimeler = ["zephyr", "nova", "orbit", "pulse", "quantum", "vortex", "storm", "ember", "echo"];
  const sayi = Math.floor(Math.random() * 1000);
  const kelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
  return `ticket-${kelime}-${sayi}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Yeni destek bileti açar.'),
  
  async execute(interaction) {
    // Buton oluştur (bilet açmak için)
    const button = new ButtonBuilder()
      .setCustomId('ticket-olustur')
      .setLabel('🎫 Destek Bileti Aç')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ content: 'Bilet açmak için butona tıkla!', components: [row], ephemeral: true });
  },

  // Buton eventini de burada yönet (index'de çağırırken execute ve butonCheck olarak kullanabilirsin)
  async buttonCheck(interaction) {
    if (!interaction.isButton()) return false;

    // Bilet açma butonu
    if (interaction.customId === 'ticket-olustur') {
      const kanalIsmi = rastgeleIsim();

      const kanal = await interaction.guild.channels.create({
        name: kanalIsmi,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
          }
        ]
      });

      const kapatButton = new ButtonBuilder()
        .setCustomId('ticket-kapat')
        .setLabel('❌ Bileti Kapat')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(kapatButton);

      await kanal.send({
        content: `${interaction.user}, destek talebin oluşturuldu!`,
        components: [row]
      });

      await interaction.reply({ content: `✅ Bilet açıldı: ${kanal}`, ephemeral: true });
      return true;
    }

    // Bilet kapatma butonu
    if (interaction.customId === 'ticket-kapat') {
      await interaction.channel.delete().catch(() => {});
      return true;
    }

    return false;
  }
};
