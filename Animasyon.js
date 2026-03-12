const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("animation")
    .setDescription("Roblox animasyon dosyasını indirir")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("Animasyon Asset ID")
        .setRequired(true)
    ),

  async execute(interaction) {

    const id = interaction.options.getString("id");

    await interaction.deferReply();

    try {

      const url = `https://assetdelivery.roblox.com/v1/asset/?id=${id}`;

      const res = await axios.get(url, {
        responseType: "arraybuffer"
      });

      const file = new AttachmentBuilder(res.data, {
        name: `animation_${id}.rbxm`
      });

      await interaction.editReply({
        content: `Animasyon dosyası hazır (ID: ${id})`,
        files: [file]
      });

    } catch (err) {

      await interaction.editReply("Animasyon bulunamadı veya indirilemedi.");

    }

  }
};
