const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("çekiliş")
    .setDescription("🎉 Premium bir çekiliş başlatır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(opt =>
      opt.setName("süre")
        .setDescription("Süre değeri (örn: 5)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("birim")
        .setDescription("Zaman birimi")
        .setRequired(true)
        .addChoices(
          { name: "Dakika", value: "minute" },
          { name: "Saat", value: "hour" },
          { name: "Gün", value: "day" },
          { name: "Ay", value: "month" }
        )
    )
    .addStringOption(opt =>
      opt.setName("ödül")
        .setDescription("Çekiliş ödülü")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("kazanan")
        .setDescription("Kazanan kişi sayısı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const val = interaction.options.getInteger("süre");
    const unit = interaction.options.getString("birim");
    const prize = interaction.options.getString("ödül");
    let winnersCount = interaction.options.getInteger("kazanan");

    const msUnits = {
      minute: 60000,
      hour: 3600000,
      day: 86400000,
      month: 2592000000
    };

    const duration = val * msUnits[unit];
    const end = Date.now() + duration;

    const participants = new Map();

    // PREMIUM RENK SETİ
    const GOLD = "#f1c40f";
    const DARK = "#1c1c1c";
    const GREEN = "#2ecc71";

    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle("🎉 **PREMIUM ÇEKİLİŞ BAŞLADI**")
      .setDescription(`🎁 **Ödül: ${prize}**`)
      .addFields(
        { name: "⏳ Süre", value: `${val} ${unit}`, inline: true },
        { name: "🏆 Kazanan", value: `${winnersCount}`, inline: true },
        { name: "👥 Katılanlar", value: "0 kişi", inline: true }
      )
      .setFooter({ text: `Başlatan: ${interaction.user.tag}` })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId("giveaway_join")
      .setLabel("🎉 Katıl / Ayrıl")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row] });

    const message = await interaction.fetchReply();

    // *** BUTON COLLECTOR ***
    const collector = message.createMessageComponentCollector({ time: duration });

    collector.on("collect", async btn => {
      if (participants.has(btn.user.id)) {
        participants.delete(btn.user.id);
        await btn.reply({ content: "❌ Çekilişten ayrıldın.", ephemeral: true });
      } else {
        participants.set(btn.user.id, true);
        await btn.reply({ content: "🎉 Çekilişe katıldın!", ephemeral: true });
      }

      // Embed güncelle
      const updated = EmbedBuilder.from(embed)
        .setColor(GOLD)
        .setFields(
          { name: "⏳ Süre", value: format(end - Date.now()), inline: true },
          { name: "🏆 Kazanan", value: `${winnersCount}`, inline: true },
          { name: "👥 Katılanlar", value: `${participants.size} kişi`, inline: true }
        );

      await message.edit({ embeds: [updated], components: [row] }).catch(() => {});
    });

    // *** HER 1 SANİYEDE BİR GÖRSEL ANİMASYON ***
    const interval = setInterval(async () => {
      const updated = EmbedBuilder.from(embed)
        .setColor(GOLD)
        .setFields(
          { name: "⏳ Süre", value: format(end - Date.now()), inline: true },
          { name: "🏆 Kazanan", value: `${winnersCount}`, inline: true },
          { name: "👥 Katılanlar", value: `${participants.size} kişi`, inline: true }
        );
      await message.edit({ embeds: [updated] }).catch(() => {});
    }, 1000);

    collector.on("end", async () => {
      clearInterval(interval);

      const disabledRow = new ActionRowBuilder().addComponents(
        ButtonBuilder.from(button).setDisabled(true)
      );

      if (participants.size === 0) {
        return await message.edit({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Çekiliş İptal Edildi")
              .setDescription("Hiç kimse katılmadı.")
              .setTimestamp()
          ],
          components: [disabledRow]
        });
      }

      if (winnersCount > participants.size) {
        winnersCount = participants.size;
      }

      const list = [...participants.keys()];
      shuffle(list);
      const winners = list.slice(0, winnersCount);

      const resEmbed = new EmbedBuilder()
        .setColor(GREEN)
        .setTitle("🏆 **ÇEKİLİŞ SONUCU**")
        .setDescription(`🎁 **Ödül: ${prize}**`)
        .addFields(
          { name: "Kazanan(lar)", value: winners.map(id => `<@${id}>`).join("\n") },
          { name: "Toplam Katılımcı", value: `${participants.size}` }
        )
        .setTimestamp();

      await message.edit({ embeds: [resEmbed], components: [disabledRow] });

      // DM gönder
      for (const id of winners) {
        const user = await interaction.client.users.fetch(id).catch(() => null);
        if (!user) continue;

        const dmEmbed = new EmbedBuilder()
          .setColor(GOLD)
          .setTitle("🎉 **TEBRİKLER!**")
          .setDescription(
            `🏆 Bir çekilişi kazandın!\n\n` +
            `🎁 **Ödül:** ${prize}\n` +
            `🌐 **Sunucu:** ${interaction.guild.name}\n\n` +
            `✨ Kazandığın için çok şanslısın!`
          )
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] }).catch(() => {});
      }
    });

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    function format(ms) {
      if (ms <= 0) return "Süre doldu";
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / (60 * 1000)) % 60;
      const h = Math.floor(ms / (60 * 60 * 1000)) % 24;
      const d = Math.floor(ms / (24 * 60 * 60 * 1000));

      return `${d ? `${d}g ` : ""}${h ? `${h}s ` : ""}${m ? `${m}dk ` : ""}${s}s`;
    }
  }
};
