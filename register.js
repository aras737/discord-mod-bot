const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar.')
    .addUserOption(option =>
      option.setName('user').setDescription('Atılacak kullanıcı').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar.')
    .addUserOption(option =>
      option.setName('user').setDescription('Banlanacak kullanıcı').setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ Komutlar yükleniyor...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ Komutlar başarıyla yüklendi.');
  } catch (err) {
    console.error('⚠️ Komut yükleme hatası:', err);
  }
})();
