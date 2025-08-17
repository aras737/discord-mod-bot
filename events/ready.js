const { REST, Routes, Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client, komutlarJSON) {
    console.log(`🤖 Bot aktif: ${client.user.tag}`);

    try {
      const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
      await rest.put(Routes.applicationCommands(client.user.id), { body: komutlarJSON });
      console.log("✅ Slash komutlar yüklendi.");
    } catch (err) {
      console.error("❌ Slash komut yükleme hatası:", err);
    }
  }
};
