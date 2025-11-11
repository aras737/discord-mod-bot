const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
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
    .setDescription("Ceza ekle, listele veya sil")
    .addSubcommand(sub =>
      sub
        .setName("ekle")
        .setDescription("Bir kullanıcıya ceza ekle")
        .addUserOption(opt => opt.setName("kullanici").setDescription("Ceza verilecek kişi").setRequired(true))
        .addStringOption(opt => opt.setName("kategori").setDescription("Ceza kategorisi (ör: küfür, asayiş)").setRequired(true))
        .addStringOption(opt => opt.setName("sebep").setDescription("Ceza sebebi").setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Tüm cezaları listele")
    )
    .addSubcommand(sub =>
      sub
        .setName("sil")
        .setDescription("Bir cezayı sil")
        .addStringOption(opt => opt.setName("id").setDescription("Silinecek ceza ID'si").setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = loadData();
    if (!db[interaction.guild.id]) db[interaction.guild.id] = [];

    if (sub === "ekle") {
      const user = interaction.options.getUser("kullanici");
      const kategori = interaction.options.getString("kategori");
      const sebep = interaction.options.getString("sebep");
      const id = Date.now().toString(36);

      db[interaction.guild.id].push({
        id,
        userId: user.id,
        kategori,
        sebep,
        moderator: interaction.user.id,
        tarih: new Date().toISOString(),
      });
      saveData(db);

      await interaction.reply({
        content: `✅ Ceza eklendi:\n👤 Kullanıcı: <@${user.id}>\n📂 Kategori: ${kategori}\n📝 Sebep: ${sebep}\n🆔 ID: ${id}`,
        ephemeral: true,
      });
    }

    if (sub === "liste") {
      const cezalar = db[interaction.guild.id];
      if (!cezalar.length)
        return interaction.reply({ content: "Hiç ceza bulunamadı.", ephemeral: true });

      const liste = cezalar
        .slice(-10)
        .map(c => `🆔 ${c.id} | 👤 <@${c.userId}> | 📂 ${c.kategori} | 📝 ${c.sebep}`)
        .join("\n");

      await interaction.reply({ content: `📋 Son cezalar:\n${liste}`, ephemeral: true });
    }

    if (sub === "sil") {
      const id = interaction.options.getString("id");
      const cezalar = db[interaction.guild.id];
      const index = cezalar.findIndex(c => c.id === id);

      if (index === -1)
        return interaction.reply({ content: "❌ Bu ID'ye ait ceza bulunamadı.", ephemeral: true });

      const silinen = cezalar.splice(index, 1)[0];
      saveData(db);

      await interaction.reply({
        content: `✅ Ceza silindi: <@${silinen.userId}> | ${silinen.kategori} | ${silinen.sebep}`,
        ephemeral: true,
      });
    }
  },
};
