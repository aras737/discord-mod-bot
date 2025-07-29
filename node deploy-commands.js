const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// KOMUTLAR: sırayla yaz, sırayla yüklenir
const commands = [
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı sunucudan banlar.'),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kullanıcıyı sunucudan atar.'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun tepki süresini gösterir.')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🧹 Önceki komutlar siliniyor...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    console.log('⬆️ Yeni komutlar yükleniyor...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Komutlar yüklendi! Sıralama: /ban, /kick, /ping');
  } catch (error) {
    console.error('❌ Komut yükleme hatası:', error);
  }
})();
