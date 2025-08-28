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
    .setName("ticket-setup")
    .setDescription("Bilet sistemi kurar"),

  async execute(interaction, client) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("🎫 Bilet Aç")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: "✅ Ticket sistemi kuruldu.", ephemeral: true });
    await interaction.channel.send({
      content: "🎟️ Destek için aşağıdaki butona tıkla!",
      components: [row],
    });

    // 📌 Eventleri burada yakala
    client.on(Events.InteractionCreate, async (btn) => {
      if (!btn.isButton()) return;

      const owner = await client.users.fetch(interaction.guild.ownerId);

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

        await btn.reply({ content: `✅ Ticket açıldı: ${ticketChannel}`, ephemeral: true });

        const closeBtn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("❌ Kapat")
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `🎟️ ${btn.user}, destek ekibi yakında seninle ilgilenecek.`,
          components: [closeBtn],
        });

        // 👑 Sunucu sahibine DM log
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
  }
};
