const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// .env'den alınan bilgiler
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Yeni komutları buraya yaz
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun tepki süresini gösterir.'),

  new SlashCommandBuilder()
    .setName('selam')
    .setDescription('Bot sana selam verir.'),

  new SlashCommandBuilder()
    .setName('yardım')
    .setDescription('Tüm komutları listeler.')
].map(command => command.toJSON());

// REST nesnesi
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🧹 Tüm eski komutlar siliniyor...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] } // tüm komutları kaldır
    );

    console.log('⬆️ Yeni komutlar yükleniyor...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Komutlar temizlendi ve yeniden yüklendi.');
  } catch (error) {
    console.error('❌ Komut yükleme hatası:', error);
  }
})();
