const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");
const discordTranscripts = require("discord-html-transcripts");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Bilet sistemi için mesaj gönderir")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("🎫 Bilet Oluştur")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: "✅ Bilet sistemi kuruldu.", ephemeral: true });

    await interaction.channel.send({
      content: "🎟️ Destek için aşağıdaki butona bas!",
      components: [row],
    });

    // 🔥 Buton etkileşimlerini buradan dinleyelim
    const collector = interaction.channel.createMessageComponentCollector();

    collector.on("collect", async (i) => {
      if (!i.isButton()) return;

      // 🎫 Ticket açma
      if (i.customId === "create_ticket") {
        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${i.user.id}`);
        if (existing) return i.reply({ content: "⚠️ Zaten açık bir ticket'in var.", ephemeral: true });

        const channel = await interaction.guild.channels.create({
          name: `ticket-${i.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: i.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
              id: interaction.guild.ownerId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
          ],
        });

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("🔒 Ticket Kapat")
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
          content: `📩 ${i.user}, ticket'in açıldı. Yetkililer yakında yardımcı olacak.`,
          components: [closeRow],
        });

        return i.reply({ content: `✅ Ticket açıldı: ${channel}`, ephemeral: true });
      }

      // 🔒 Ticket kapatma
      if (i.customId === "close_ticket") {
        const transcript = await discordTranscripts.createTranscript(i.channel, {
          limit: -1,
          returnBuffer: false,
          fileName: `ticket-${i.user.username}.html`
        });

        try {
          const owner = await i.client.users.fetch(i.guild.ownerId);
          await owner.send({
            content: `📑 Ticket kapatıldı: **${i.channel.name}**`,
            files: [transcript]
          });
        } catch (err) {
          console.error("❌ Sunucu sahibine DM gönderilemedi:", err.message);
        }

        await i.channel.delete().catch(() => null);
      }
    });
  },
};
