const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require("discord.js");

/**
 * /çekiliş time_value: integer (sayı)
 * time_unit: seçim (dk, saat, gün, ay)
 * ödül: string
 * kazanan_sayisi: integer
 *
 * Kullanım: yetkili biri komutu tetikler -> kanal içine embed atılır, herkes görebilir.
 * Butona tıklayanlar katılır/çıkar (toggle). Süre dolunca rastgele kazanan(lar) seçilir,
 * kanal içine embed ile sonuç atılır ve kazananlara DM de gönderilir.
 *
 * Not: Bu komut kısa süreli çekilişleri destekler. Embed güncellemeleri her saniye yapılır
 * (Discord rate limit'lerine dikkat; çok fazla çekiliş aynı anda olursa hatalar olabilir).
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName("çekiliş")
    .setDescription("Yeni bir çekiliş başlatır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(opt =>
      opt.setName("time_value")
        .setDescription("Süre değeri (ör: 5)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time_unit")
        .setDescription("Süre birimi")
        .setRequired(true)
        .addChoices(
          { name: "dakika", value: "minute" },
          { name: "saat", value: "hour" },
          { name: "gün", value: "day" },
          { name: "ay", value: "month" }
        )
    )
    .addStringOption(opt =>
      opt.setName("ödül")
        .setDescription("Çekiliş ödülü")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("kazanan_sayisi")
        .setDescription("Kazanan kişi sayısı")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Parametreleri al
    const value = interaction.options.getInteger("time_value", true);
    const unit = interaction.options.getString("time_unit", true); // minute/hour/day/month
    const prize = interaction.options.getString("ödül", true);
    let winnersCount = interaction.options.getInteger("kazanan_sayisi", true);

    // Süreyi ms'e çevir
    const unitMultipliers = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    if (value <= 0 || winnersCount <= 0) {
      return interaction.reply({ content: "Süre ve kazanan sayısı 1 veya daha büyük olmalıdır.", ephemeral: true });
    }

    const multiplier = unitMultipliers[unit];
    if (!multiplier) return interaction.reply({ content: "Geçersiz zaman birimi.", ephemeral: true });

    const duration = value * multiplier;
    const startTimestamp = Date.now();
    const endTimestamp = startTimestamp + duration;

    // Hazırlık: embed ve buton
    const embed = new EmbedBuilder()
      .setTitle("ÇEKİLİŞ BAŞLADI")
      .setDescription(prize)
      .addFields(
        { name: "Süre", value: `${value} ${unit}`, inline: true },
        { name: "Kazanan sayısı", value: `${winnersCount}`, inline: true },
        { name: "Katılanlar", value: `0`, inline: true }
      )
      .setFooter({ text: `Başlatan: ${interaction.user.tag}` })
      .setTimestamp();

    const enterButton = new ButtonBuilder()
      .setCustomId("giveaway_enter")
      .setLabel("Katıl / Çık")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(enterButton);

    // Yalnızca yönetici/komutu kullananın açıkladığı mesaj: herkes görsün
    await interaction.deferReply({ ephemeral: false });

    const sent = await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true });

    // Katılımcılar seti (userId -> true)
    const participants = new Map();

    // Collector kur (butonlar için). Süre: duration ms
    const collector = sent.createMessageComponentCollector({ time: duration });

    // İç toggle davranışı: bir daha basarsa çıkar
    collector.on("collect", async (btn) => {
      try {
        // Kullanıcı katılımcı toggle
        const uid = btn.user.id;

        if (participants.has(uid)) {
          participants.delete(uid);
          // cevap: özel bilgilendirme
          await btn.reply({ content: "Çekilişten ayrıldınız.", ephemeral: true });
        } else {
          participants.set(uid, btn.user.tag);
          await btn.reply({ content: "Çekilişe katıldınız.", ephemeral: true });
        }

        // Embed güncelle: güncel katılımcı sayısı ve kalan süre
        const remainingMs = Math.max(0, endTimestamp - Date.now());
        const remaining = formatDuration(remainingMs);
        const newEmbed = EmbedBuilder.from(embed)
          .setFields(
            { name: "Süre", value: remaining, inline: true },
            { name: "Kazanan sayısı", value: `${winnersCount}`, inline: true },
            { name: "Katılanlar", value: `${participants.size}`, inline: true }
          );

        // try-catch ile editReply (rate limit koruması)
        try {
          await sent.edit({ embeds: [newEmbed], components: [row] });
        } catch (e) {
          // ignore edit hatası (rate limit vs.)
        }
      } catch (err) {
        console.error("Collector collect error:", err);
      }
    });

    // Her saniye embed güncellemesi (kalan süre ve katılımcı sayısı)
    const interval = setInterval(async () => {
      try {
        const remainingMs = Math.max(0, endTimestamp - Date.now());
        const remaining = formatDuration(remainingMs);
        const newEmbed = EmbedBuilder.from(embed)
          .setFields(
            { name: "Süre", value: remaining, inline: true },
            { name: "Kazanan sayısı", value: `${winnersCount}`, inline: true },
            { name: "Katılanlar", value: `${participants.size}`, inline: true }
          );
        try {
          await sent.edit({ embeds: [newEmbed], components: [row] });
        } catch (e) {
          // ignore (rate limit)
        }
      } catch (e) {
        // ignore
      }
    }, 1000);

    // Collector end -> çekiliş bitiş işlemleri
    collector.on("end", async () => {
      clearInterval(interval);

      // Disable button
      const disabledRow = new ActionRowBuilder().addComponents(
        ButtonBuilder.from(enterButton).setDisabled(true)
      );

      // Eğer hiç katılımcı yoksa bilgilendir
      if (participants.size === 0) {
        const noParticipantsEmbed = EmbedBuilder.from(embed)
          .setTitle("ÇEKİLİŞ SONUÇLANDI")
          .setDescription(prize)
          .setFields(
            { name: "Durum", value: "Katılan olmadığı için çekiliş iptal edildi.", inline: false }
          )
          .setFooter({ text: `Başlatan: ${interaction.user.tag}` })
          .setTimestamp();

        try {
          await sent.edit({ embeds: [noParticipantsEmbed], components: [disabledRow] });
          await interaction.followUp({ content: "Çekiliş katılımcı olmadığı için sonlandırıldı.", ephemeral: false });
        } catch (e) {}
        return;
      }

      // Kazanan sayısı katılımcı sayısından fazla ise düzelt
      if (winnersCount > participants.size) winnersCount = participants.size;

      // Katılımcıları diziye al ve rastgele seç
      const participantIds = Array.from(participants.keys());
      shuffleArray(participantIds);

      const winners = participantIds.slice(0, winnersCount);

      // Kanal ve DM bildirimleri
      const winnersMention = winners.map(id => `<@${id}>`).join(", ");
      const resultEmbed = new EmbedBuilder()
        .setTitle("ÇEKİLİŞ SONUÇLANDI")
        .setDescription(prize)
        .addFields(
          { name: "Kazanan(lar)", value: winnersMention || "Yok", inline: false },
          { name: "Katılanlar", value: `${participants.size}`, inline: true },
          { name: "Kazanan sayısı", value: `${winnersCount}`, inline: true }
        )
        .setFooter({ text: `Başlatan: ${interaction.user.tag}` })
        .setTimestamp();

      try {
        await sent.edit({ embeds: [resultEmbed], components: [disabledRow] });
      } catch (e) {}

      // Kanal duyurusu (mention kazananlar)
      try {
        await interaction.followUp({ content: `${winners.map(id => `<@${id}>`).join(" ")} çekilişi kazandı.`, ephemeral: false });
        await interaction.followUp({ embeds: [resultEmbed], ephemeral: false });
      } catch (e) {}

      // DM ile kazananlara bildirim gönder
      for (const winnerId of winners) {
        try {
          const user = await interaction.client.users.fetch(winnerId);
          await user.send({
            content: `Tebrikler! Sunucuda başlatılan çekilişi kazandınız.\nÖdül: ${prize}\nSunucu: ${interaction.guild.name}`
          }).catch(() => {
            // DM kapalı olabilir
          });
        } catch (e) {
          console.error("DM gönderme hatası:", e);
        }
      }
    });

    // İlk etkileşim mesajını düzenle (başlangıç durumu)
    const remainingInitial = formatDuration(duration);
    const initialEmbed = EmbedBuilder.from(embed)
      .setFields(
        { name: "Süre", value: remainingInitial, inline: true },
        { name: "Kazanan sayısı", value: `${winnersCount}`, inline: true },
        { name: "Katılanlar", value: `0`, inline: true }
      );

    try {
      await sent.edit({ embeds: [initialEmbed] });
    } catch (e) {}

    // Son olarak komutu kullanan kişiye başarılı cevap (özet)
    try {
      await interaction.editReply({ content: `Çekiliş başlatıldı: Ödül "${prize}" — Süre: ${value} ${unit} — Kazanan sayısı: ${winnersCount}`, ephemeral: false });
    } catch (e) {
      // Eğer deferReply + followUp kullanıldıysa, zaten followUp ile mesaj gönderildi
    }

    // Helper fonksiyonlar
    function formatDuration(ms) {
      if (ms <= 0) return "Süre doldu";
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / (60 * 1000)) % 60;
      const h = Math.floor(ms / (60 * 60 * 1000)) % 24;
      const d = Math.floor(ms / (24 * 60 * 60 * 1000));
      const parts = [];
      if (d) parts.push(`${d}g`);
      if (h) parts.push(`${h}s`);
      if (m) parts.push(`${m}dk`);
      if (s) parts.push(`${s}s`);
      return parts.join(" ");
    }

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  }
};
