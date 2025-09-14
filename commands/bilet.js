const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  ChannelType, 
  Events 
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bilet-sistemi")
    .setDescription("Bilet sistemi yaratır"),

  async execute(interaction, client) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("Bilet Aç")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: "Bilet sistemi kuruldu.", ephemeral: true });
    await interaction.channel.send({
      content: "Merhaba sayın LAO kullanıcısı burada eğer LAO'da sorunun olursa bu bilet sisteminden bilet açabilirsin.",
      components: [row],
    });

    const owner = await client.users.fetch(interaction.guild.ownerId);

    // 📌 Ticket oluşturma ve kapatma eventleri
    client.on(Events.InteractionCreate, async (btn) => {
      if (!btn.isButton()) return;

      // 🎫 Ticket oluşturma
      if (btn.customId === "create_ticket") {
        const ticketChannel = await btn.guild.channels.create({
          name: `ticket-${btn.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: btn.guild.id, deny: ["ViewChannel"] },
            { id: btn.user.id, allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"] },
            { id: btn.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] }
          ],
        });

        await btn.reply({ content: `Bilet açıldı: ${ticketChannel}`, ephemeral: true });

        const closeBtn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Kapat")
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `${btn.user}, Destek ekibimiz hemen sizle ilgilenecek.`,
          components: [closeBtn],
        });

        // 👑 Sunucu sahibine log gönder
        const embed = new EmbedBuilder()
          .setTitle("📌 Yeni Ticket Açıldı")
          .setDescription(`**Kullanıcı:** ${btn.user.tag}\n**Kanal:** ${ticketChannel}`)
          .setColor("Green")
          .setTimestamp();

        await owner.send({ embeds: [embed] }).catch(() => {});
      }

      // ❌ Ticket kapatma
      if (btn.customId === "close_ticket") {
        const embed = new EmbedBuilder()
          .setTitle("❌ Ticket Kapatıldı")
          .setDescription(`**Kapatıldı:** ${btn.channel.name}\n**Kullanıcı:** ${btn.user.tag}`)
          .setColor("Red")
          .setTimestamp();

        await owner.send({ embeds: [embed] }).catch(() => {});
        await btn.channel.delete().catch(() => {});
      }
    });

    // 📌 Ticket kanalındaki mesajları logla
    client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      if (!message.channel.name.startsWith("ticket-")) return;

      const embed = new EmbedBuilder()
        .setTitle("💬 Ticket Mesaj Log")
        .addFields(
          { name: "👤 Kullanıcı", value: `${message.author.tag}`, inline: true },
          { name: "📍 Kanal", value: `${message.channel.name}`, inline: true },
          { name: "📝 Mesaj", value: message.content || "*[dosya/boş mesaj]*" }
        )
        .setColor("Blue")
        .setTimestamp();

      await owner.send({ embeds: [embed] }).catch(() => {});
    });
  }
};
