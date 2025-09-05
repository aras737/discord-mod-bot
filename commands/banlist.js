const fs = require("fs");
const path = require("path");
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const banListPath = path.join(__dirname, "../data/banlist.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banlist")
    .setDescription("Banlanan kullanıcıların listesini gösterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmak için `Üyeleri Yasakla` iznin olmalı.",
        ephemeral: true,
      });
    }

    if (!fs.existsSync(banListPath)) {
      return interaction.reply({
        content: "📂 Henüz hiç ban kaydı yok.",
        ephemeral: true,
      });
    }

    const banList = JSON.parse(fs.readFileSync(banListPath));

    if (banList.length === 0) {
      return interaction.reply({
        content: "✅ Ban listesi boş.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🚫 Ban Listesi")
      .setColor("Red")
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `Toplam yasaklı: ${banList.length}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const description = banList
      .map(
        (entry, index) =>
          `**${index + 1}.** 👤 <@${entry.userId}> | \`${entry.tag}\`\n📌 Sebep: *${entry.reason}*\n👮 Yetkili: ${entry.bannedBy}\n📅 Tarih: <t:${Math.floor(
            new Date(entry.date).getTime() / 1000
          )}:F>\n`
      )
      .join("\n──────────────────────\n");

    embed.setDescription(
      description.length > 4000
        ? description.slice(0, 4000) + "\n... (devamı var)"
        : description
    );

    await interaction.reply({ embeds: [embed] });
  },
};
