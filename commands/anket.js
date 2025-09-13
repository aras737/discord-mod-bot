const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rehber")
    .setDescription("Sunucu rehberini gösterir."),
    
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Sunucu Rehberi")
      .setDescription(
        "Aşağıda branşlarımızın ve departmanlarımızın Discord sunucuları yer almaktadır. " +
        "Linklere tıklayarak katılım sağlayabilirsiniz."
      )
      .addFields(
        {
          name: "Branş Sunucuları",
          value:
            "[Askeri İnzibat](https://discord.gg/xxx)\n" +
            "[Özel Harekat Komutanlığı](https://discord.gg/xxx)\n" +
            "[Jandarma Genel Komutanlığı](https://discord.gg/xxx)\n" +
            "[Kara Kuvvetleri Komutanlığı](https://discord.gg/xxx)\n" +
            "[Hava Kuvvetleri Komutanlığı](https://discord.gg/xxx)\n" +
            "[Sınır Müfettişleri](https://discord.gg/xxx)\n" + 
        }, // <-- Düzeltme burada!
        {
          name: "Departman Sunucuları",
          value:
            "[Moderatör Ekibi](https://discord.gg/xxx)\n" +
            "[Ordu Yönetimi](https://discord.gg/xxx)\n" +
            "[Subay Akademisi](https://discord.gg/xxx)\n" +
            "[Dışişleri](https://discord.gg/xxx)\n" +
            "[Sürücü Okulu](https://discord.gg/xxx)\n" +
            "[Yetkili Akademisi](https://discord.gg/xxx)"
        },
        {
          name: "Bilgilendirme",
          value:
            "Sunucularımız bu şekildedir. Eğer Roblox gruplarına ulaşmak isterseniz [Buraya Tıklayın](https://roblox.com/groups/xxx) ve ardından müttefikler kısmına basın. Roblox gruplarına bu şekilde ulaşabilirsiniz. İyi eğlenceler!"
        }
      )
      .setColor("Red")
      .setFooter({ text: "Sentanel", iconURL: "https://i.imgur.com/xxx.png" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
