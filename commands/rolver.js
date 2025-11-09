const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Events 
} = require('discord.js');

const ALLOWED_USERS = [
  "752639955049644034", // 1. Kullanıcı
  "1389930042200559706" // 2. Kullanıcı
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rollersil")
    .setDescription("Sunucudaki silinebilen tüm rolleri siler (sadece belirli kullanıcılar kullanabilir)."),

  async execute(interaction, client) {
    // 🔒 Yetki kontrolü
    if (!ALLOWED_USERS.includes(interaction.user.id)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmaya yetkiniz yok.",
        ephemeral: true
      });
    }

    // Onay butonları
    const confirmId = `confirm_${interaction.user.id}_${Date.now()}`;
    const cancelId = `cancel_${interaction.user.id}_${Date.now()}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmId)
        .setLabel("Evet, tüm rolleri sil")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(cancelId)
        .setLabel("Hayır, iptal")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "⚠️ Bu işlem **geri alınamaz!** Sunucudaki tüm silinebilir roller silinecek.\nEmin misiniz?",
      components: [row],
      ephemeral: true
    });

    // --- Event yakalama (komut dosyası içinde) ---
    const collector = interaction.channel.createMessageComponentCollector({ time: 60_000 });

    collector.on("collect", async i => {
      // Sadece komutu kullanan butonlara tıklayabilir
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "❌ Bu butona basamazsınız.", ephemeral: true });
      }

      // ❌ İptal edilirse
      if (i.customId === cancelId) {
        await i.update({
          content: "❌ İşlem iptal edildi.",
          components: []
        });
        collector.stop();
        return;
      }

      // ✅ Onaylandıysa
      if (i.customId === confirmId) {
        await i.update({
          content: "🧨 Roller siliniyor... Bu işlem birkaç saniye sürebilir.",
          components: []
        });

        const guild = interaction.guild;
        const botMember = await guild.members.fetchMe();
        const botTopRole = botMember.roles.highest.position;

        const roles = await guild.roles.fetch();
        const deletable = roles.filter(r => 
          r.id !== guild.id && // everyone
          !r.managed && 
          r.position < botTopRole
        );

        let deleted = 0;
        let failed = 0;

        for (const [id, role] of deletable) {
          try {
            await role.delete(`RollerSil komutu - ${interaction.user.tag}`);
            deleted++;
            await new Promise(res => setTimeout(res, 400)); // rate limit koruması
          } catch (err) {
            failed++;
            console.error(`[RollerSil] ${role.name} silinemedi: ${err.message}`);
          }
        }

        await i.followUp({
          content: `✅ İşlem tamamlandı.\nSilinen roller: **${deleted}**\nSilinemeyen roller: **${failed}**`,
          ephemeral: true
        });

        collector.stop();
      }
    });

    collector.on("end", async () => {
      try {
        const message = await interaction.fetchReply();
        await message.edit({ components: [] });
      } catch (err) {}
    });
  },
};
