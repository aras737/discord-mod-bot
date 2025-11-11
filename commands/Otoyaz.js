const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(process.cwd(), "cezalar.json");

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ceza")
    .setDescription("Kullanıcılara ceza ekle, listele veya kaldır.")
    .addSubcommand(sub =>
      sub
        .setName("ekle")
        .setDescription("Bir kullanıcıya ceza ekler.")
        .addUserOption(opt => 
          opt.setName("kullanici")
            .setDescription("Ceza verilecek kullanıcı.")
            .setRequired(true))
        .addStringOption(opt => 
          opt.setName("kategori")
            .setDescription("Ceza kategorisi (örnek: küfür, reklam, asayiş).")
            .setRequired(true))
        .addStringOption(opt => 
          opt.setName("sebep")
            .setDescription("Ceza sebebi.")
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Sunucudaki cezaları listeler.")
    )
    .addSubcommand(sub =>
      sub
        .setName("sil")
        .setDescription("Bir cezayı ID'sine göre siler.")
        .addStringOption(opt => 
          opt.setName("id")
            .setDescription("Silinecek cezanın ID'si.")
            .setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = loadData();
    const guildId = interaction.guild.id;

    if (!db[guildId]) db[guildId] = [];

    // CEZA EKLE
    if (sub === "ekle") {
      const user = interaction.options.getUser("kullanici");
      const kategori = interaction.options.getString("kategori");
      const sebep = interaction.options.getString("sebep");
      const id = Date.now().toString(36);

      const record = {
        id,
        userId: user.id,
        kategori,
        sebep,
        moderator: interaction.user.id,
        tarih: new Date().toISOString(),
      };

      db[guildId].push(record);
      saveData(db);

      const embed = new EmbedBuilder()
        .setTitle("Yeni Ceza Kaydı")
        .setColor("Red")
        .addFields(
          { name: "Kullanıcı", value: `${user.tag} (${user.id})`, inline: false },
          { name: "Kategori", value: kategori, inline: true },
          { name: "Sebep", value: sebep, inline: true },
          { name: "Ceza ID", value: id, inline: true },
          { name: "Yetkili", value: interaction.user.tag, inline: false },
          { name: "Tarih", value: new Date().toLocaleString("tr-TR"), inline: false }
        );

      await interaction.reply({ embeds: [embed] });
    }

    // CEZA LİSTE
    if (sub === "liste") {
      const cezalar = db[guildId];
      if (!cezalar || cezalar.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Ceza Listesi")
              .setDescription("Bu sunucuda kayıtlı bir ceza bulunmuyor.")
              .setColor("Blue"),
          ],
        });
      }

      const metin = cezalar
        .slice(-10)
        .map(c => 
          `**ID:** ${c.id}\n**Kullanıcı:** <@${c.userId}> (${c.userId})\n**Kategori:** ${c.kategori}\n**Sebep:** ${c.sebep}\n**Yetkili:** <@${c.moderator}>\n**Tarih:** ${new Date(c.tarih).toLocaleString("tr-TR")}`
        )
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle("Ceza Listesi")
        .setDescription(metin)
        .setColor("Orange")
        .setFooter({ text: "Son 10 ceza gösterilmektedir." });

      await interaction.reply({ embeds: [embed] });
    }

    // CEZA SİL
    if (sub === "sil") {
      const id = interaction.options.getString("id");
      const cezalar = db[guildId];
      const index = cezalar.findIndex(c => c.id === id);

      if (index === -1) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Ceza Silme")
              .setDescription("Bu ID'ye sahip bir ceza bulunamadı.")
              .setColor("Grey"),
          ],
        });
      }

      const silinen = cezalar.splice(index, 1)[0];
      saveData(db);

      const embed = new EmbedBuilder()
        .setTitle("Ceza Kaydı Silindi")
        .setColor("Green")
        .addFields(
          { name: "Kullanıcı", value: `<@${silinen.userId}>`, inline: false },
          { name: "Kategori", value: silinen.kategori, inline: true },
          { name: "Sebep", value: silinen.sebep, inline: true },
          { name: "Ceza ID", value: silinen.id, inline: true }
        );

      await interaction.reply({ embeds: [embed] });
    }
  },
};
