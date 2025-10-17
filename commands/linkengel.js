const { SlashCommandBuilder, PermissionFlagsBits, Events } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("linkengel")
    .setDescription("Link engelleme sistemini açar veya kapatır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("durum")
        .setDescription("Link engellemeyi aç veya kapat")
        .setRequired(true)
        .addChoices(
          { name: "Aç", value: "ac" },
          { name: "Kapat", value: "kapat" }
        )
    )
    .addChannelOption(option =>
      option
        .setName("logkanal")
        .setDescription("Logların gönderileceği kanal")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const durum = interaction.options.getString("durum");
    const logChannel = interaction.options.getChannel("logkanal");

    // index.js içinde QuickDB zaten tanımlıysa onu kullan
    const db = client.db;

    if (!db) {
      return interaction.reply({
        content: "❌ Veritabanı (QuickDB) bulunamadı. Lütfen index.js dosyasında QuickDB'yi tanımlayın:\n```js\nclient.db = new QuickDB();\n```",
        ephemeral: true
      });
    }

    await db.set(`linkEngel_${interaction.guild.id}`, durum === "ac");
    await db.set(`linkLog_${interaction.guild.id}`, logChannel.id);

    const acKapa = durum === "ac" ? "aktif" : "devre dışı";
    await interaction.reply({
      content: `✅ Link engelleme sistemi **${acKapa}** edildi. Log kanalı: ${logChannel}`,
      ephemeral: true
    });

    // Event zaten kuruluysa tekrar kurma
    if (client.linkEngelEventKurulu) return;
    client.linkEngelEventKurulu = true;

    // 🔥 Mesaj Engelleme Eventi
    client.on(Events.MessageCreate, async message => {
      if (!message.guild || message.author.bot) return;

      const engelAktif = await db.get(`linkEngel_${message.guild.id}`);
      if (!engelAktif) return;

      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      if (linkRegex.test(message.content)) {
        try {
          await message.delete();

          const logId = await db.get(`linkLog_${message.guild.id}`);
          const logKanal = message.guild.channels.cache.get(logId);
          if (logKanal) {
            logKanal.send({
              content: `🚫 **${message.author.tag}** link paylaştı ve silindi.\nMesaj içeriği: ${message.content}`
            });
          }

          await message.channel.send({
            content: `❌ ${message.author}, bu sunucuda link paylaşımı yasak!`,
            ephemeral: true
          }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

        } catch (err) {
          console.error("Link silinirken hata:", err);
        }
      }
    });
  }
};
