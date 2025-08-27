const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sablon-askeri")
    .setDescription("Sunucuyu sıfırlar ve askeri şablon kurar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply("🪖 Sunucu sıfırlanıyor ve askeri şablon kuruluyor...");

    try {
      // 📌 1. Mevcut tüm kanalları sil
      interaction.guild.channels.cache.forEach(async (channel) => {
        try {
          await channel.delete();
        } catch (err) {
          console.log(`Kanal silinemedi: ${channel.name}`);
        }
      });

      // 📌 2. Mevcut rolleri sil (Discord'un default @everyone rolü hariç!)
      interaction.guild.roles.cache.forEach(async (role) => {
        if (role.name !== "@everyone") {
          try {
            await role.delete();
          } catch (err) {
            console.log(`Rol silinemedi: ${role.name}`);
          }
        }
      });

      // 📌 3. Yeni roller oluştur
      const roles = {};
      roles.komutan = await interaction.guild.roles.create({ name: "Komutan", color: "Red" });
      roles.subay = await interaction.guild.roles.create({ name: "Subay", color: "Blue" });
      roles.astsubay = await interaction.guild.roles.create({ name: "Astsubay", color: "Green" });
      roles.er = await interaction.guild.roles.create({ name: "Er", color: "Grey" });

      // 📌 4. Yeni kategoriler ve kanallar
      const kategoriKara = await interaction.guild.channels.create({
        name: "🪖 Kara Kuvvetleri",
        type: ChannelType.GuildCategory,
      });

      await interaction.guild.channels.create({
        name: "genel-sohbet",
        type: ChannelType.GuildText,
        parent: kategoriKara.id,
      });

      await interaction.guild.channels.create({
        name: "emir-komuta",
        type: ChannelType.GuildText,
        parent: kategoriKara.id,
      });

      const kategoriHava = await interaction.guild.channels.create({
        name: "✈️ Hava Kuvvetleri",
        type: ChannelType.GuildCategory,
      });

      await interaction.guild.channels.create({
        name: "hava-sohbet",
        type: ChannelType.GuildText,
        parent: kategoriHava.id,
      });

      await interaction.guild.channels.create({
        name: "pilot-talimatlari",
        type: ChannelType.GuildText,
        parent: kategoriHava.id,
      });

      const kategoriDeniz = await interaction.guild.channels.create({
        name: "⚓ Deniz Kuvvetleri",
        type: ChannelType.GuildCategory,
      });

      await interaction.guild.channels.create({
        name: "deniz-sohbet",
        type: ChannelType.GuildText,
        parent: kategoriDeniz.id,
      });

      await interaction.guild.channels.create({
        name: "gorev-merkezi",
        type: ChannelType.GuildText,
        parent: kategoriDeniz.id,
      });

      // 📌 5. Embed ile bildirim
      const embed = new EmbedBuilder()
        .setTitle("🪖 Askeri Sunucu Şablonu Kuruldu")
        .setDescription("Tüm eski kanallar & roller silindi ve yeni askeri sistem kuruldu.")
        .addFields(
          { name: "🎖️ Roller", value: "Komutan, Subay, Astsubay, Er" },
          { name: "📂 Kategoriler", value: "Kara Kuvvetleri, Hava Kuvvetleri, Deniz Kuvvetleri" }
        )
        .setColor("DarkGreen")
        .setTimestamp();

      await interaction.followUp({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.followUp("❌ Bir hata oluştu, şablon kurulamadı.");
    }
  },
};
