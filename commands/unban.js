const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");
const fs = require("fs");

const delay = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Duyuru sistemi")
    .addSubcommand(sc =>
      sc
        .setName("gonder")
        .setDescription("Herkese DM duyuru gönderir")
        .addStringOption(o =>
          o.setName("mesaj").setDescription("Duyuru mesajı").setRequired(true)
        )
    )
    .addSubcommand(sc =>
      sc
        .setName("liste")
        .setDescription("Gönderilen duyuruları listeler")
    )
    .addSubcommand(sc =>
      sc
        .setName("log-ayarla")
        .setDescription("Log kanalını ayarlar (eskisini siler)")
        .addChannelOption(o =>
          o.setName("kanal").setDescription("Log kanalı").setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const duyurular = JSON.parse(fs.readFileSync("duyurular.json", "utf8"));
    const config = JSON.parse(fs.readFileSync("duyuruConfig.json", "utf8"));

    /* ================= LOG AYARLA ================= */
    if (sub === "log-ayarla") {
      const kanal = interaction.options.getChannel("kanal");
      config.logChannelId = kanal.id;

      fs.writeFileSync(
        "duyuruConfig.json",
        JSON.stringify(config, null, 2)
      );

      return interaction.reply({
        content: `Log kanalı ayarlandı: ${kanal}\nÖnceki log otomatik olarak devre dışı bırakıldı.`,
        ephemeral: true
      });
    }

    /* ================= LİSTE ================= */
    if (sub === "liste") {
      if (duyurular.length === 0) {
        return interaction.reply({
          content: "Kayıtlı duyuru bulunmuyor.",
          ephemeral: true
        });
      }

      const text = duyurular
        .slice(-5)
        .reverse()
        .map((d, i) =>
          `${i + 1}. ${d.sunucu}\nYetkili: ${d.yetkili}\n${d.gonderilen} gönderildi / ${d.gonderilemeyen} başarısız\n<t:${Math.floor(
            new Date(d.tarih).getTime() / 1000
          )}:R>`
        )
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("Son Duyurular")
        .setDescription(text);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /* ================= GÖNDER ================= */
    if (sub === "gonder") {
      const mesaj = interaction.options.getString("mesaj");
      const guild = interaction.guild;
      const yetkili = interaction.user;

      await interaction.reply({
        content: "Duyuru gönderimi başlatıldı.",
        ephemeral: true
      });

      const duyuruEmbed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("Duyuru")
        .setDescription(mesaj)
        .addFields(
          { name: "Sunucu", value: guild.name, inline: true },
          {
            name: "Tarih",
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true
          }
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({
          text: guild.name,
          iconURL: guild.iconURL({ dynamic: true })
        });

      const members = await guild.members.fetch();
      let ok = 0;
      let fail = 0;

      for (const member of members.values()) {
        if (member.user.bot) continue;

        try {
          await member.send({ embeds: [duyuruEmbed] });
          ok++;
        } catch {
          fail++;
        }
        await delay(1500);
      }

      // JSON kayıt
      const kayit = {
        sunucu: guild.name,
        yetkili: yetkili.tag,
        mesaj,
        gonderilen: ok,
        gonderilemeyen: fail,
        tarih: new Date().toISOString()
      };

      duyurular.push(kayit);
      fs.writeFileSync(
        "duyurular.json",
        JSON.stringify(duyurular, null, 2)
      );

      // Log kanalı
      if (config.logChannelId) {
        const logChannel = interaction.client.channels.cache.get(
          config.logChannelId
        );

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("#444444")
            .setTitle("Duyuru Logu")
            .setDescription(mesaj)
            .addFields(
              { name: "Yetkili", value: yetkili.tag, inline: true },
              { name: "Sunucu", value: guild.name, inline: true },
              {
                name: "Sonuç",
                value: `${ok} gönderildi / ${fail} başarısız`
              }
            )
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({
              text: new Date().toLocaleString("tr-TR")
            });

          logChannel.send({ embeds: [logEmbed] });
        }
      }
    }
  }
};
