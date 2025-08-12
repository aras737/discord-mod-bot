const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionCollector } = require('discord.js');

const kurallarSayfalari = [
  {
    title: "Sunucu Kuralları - 1/4",
    description: `
1️⃣ **Saygı:** Herkes birbirine saygılı olmalı. Küfür, hakaret ve aşağılama kesinlikle yasaktır.  
2️⃣ **Spam:** Spam yapmak, caps lock kullanmak veya aynı mesajı tekrar tekrar atmak yasaktır.  
3️⃣ **Reklam:** İzin olmadan herhangi bir reklam yapmak yasaktır.  
`
  },
  {
    title: "Sunucu Kuralları - 2/4",
    description: `
4️⃣ **Yetkililere Saygı:** Yetkililerin uyarı ve kararlarına saygı gösterilmelidir.  
5️⃣ **Özel Kanallar:** Özel kanallarda sadece o kanalın konusuyla ilgili sohbet edilmelidir.  
6️⃣ **NSFW İçerik:** Her türlü müstehcen ve NSFW içerik yasaktır.  
`
  },
  {
    title: "Sunucu Kuralları - 3/4",
    description: `
7️⃣ **Kişisel Bilgiler:** Başkalarının kişisel bilgilerini paylaşmak kesinlikle yasaktır.  
8️⃣ **Bot Kullanımı:** Bot komutları belirtilen kanallarda kullanılmalıdır.  
9️⃣ **Yetki İhlali:** Yetkiler kötüye kullanılamaz, ihlal edenlere yaptırım uygulanır.  
`
  },
  {
    title: "Sunucu Kuralları - 4/4",
    description: `
🔟 **Genel Davranış:** Herkesin sunucuda iyi vakit geçirmesi için çaba göstermesi beklenir.  
❗ Kurallara uymayanlar uyarılır, tekrarı halinde sunucudan uzaklaştırılır.  
📌 Yetkililer karar mercii olup son sözü söyleme hakkına sahiptir.  
`
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurallar')
    .setDescription('Sunucu kurallarını sayfalar halinde gösterir.'),

  async execute(interaction) {
    let sayfa = 0;

    const embed = new EmbedBuilder()
      .setTitle(kurallarSayfalari[sayfa].title)
      .setDescription(kurallarSayfalari[sayfa].description)
      .setColor('Random')
      .setFooter({ text: `Sayfa ${sayfa + 1} / ${kurallarSayfalari.length}` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('onceki')
          .setLabel('⬅️ Önceki')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('sonraki')
          .setLabel('Sonraki ➡️')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 });

    collector.on('collect', async i => {
      if (i.customId === 'onceki') {
        sayfa--;
        if (sayfa < 0) sayfa = 0;
      } else if (i.customId === 'sonraki') {
        sayfa++;
        if (sayfa >= kurallarSayfalari.length) sayfa = kurallarSayfalari.length - 1;
      }

      // Buton durumlarını güncelle
      const oncekiBtn = row.components[0];
      const sonrakiBtn = row.components[1];
      oncekiBtn.setDisabled(sayfa === 0);
      sonrakiBtn.setDisabled(sayfa === kurallarSayfalari.length - 1);

      const yeniEmbed = new EmbedBuilder()
        .setTitle(kurallarSayfalari[sayfa].title)
        .setDescription(kurallarSayfalari[sayfa].description)
        .setColor('Random')
        .setFooter({ text: `Sayfa ${sayfa + 1} / ${kurallarSayfalari.length}` });

      await i.update({ embeds: [yeniEmbed], components: [row] });
    });

    collector.on('end', () => {
      row.components.forEach(btn => btn.setDisabled(true));
      interaction.editReply({ components: [row] });
    });
  }
};
