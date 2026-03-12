const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("asset")
    .setDescription("Roblox asset indirir")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("Asset ID")
        .setRequired(true)
    ),

  async execute(interaction) {

    const id = interaction.options.getString("id");

    await interaction.deferReply();

    try {

      const url = `https://assetdelivery.roblox.com/v1/asset/?id=${id}`;

      const response = await axios.get(url, {
        responseType: "arraybuffer"
      });

      const file = new AttachmentBuilder(response.data, {
        name: `asset_${id}.rbxm`
      });

      await interaction.editReply({
        content: `Asset indirildi\nID: ${id}`,
        files: [file]
      });

    } catch (error) {

      await interaction.editReply(
        "Asset bulunamadı veya indirilemedi."
      );

    }

  }
};
