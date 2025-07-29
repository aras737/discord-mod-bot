const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// Gerekli bilgiler
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Bot ID
const GUILD_ID = process.env.GUILD_ID;   // Sunucu ID

// Yeni komutları buraya tanımla
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun tepki süresini gösterir.'),

  new SlashCommandBuilder()
    .setName('selam')
    .setDescription('Bot sana selam verir.')
].map(cmd => cmd.toJSON());

// REST API ayarı
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🗑️ Eski komutlar siliniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('📝 Yeni komutlar yükleniyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    console.log('✅ Komutlar başarıyla güncellendi.');
  } catch (error) {
    console.error('❌ Komutları yüklerken hata oluştu:', error);
  }
})();
