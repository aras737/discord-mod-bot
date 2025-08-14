const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  InteractionType,
} = require('discord.js');
const config = require('./config.json'); // Rollerin ve komut yetkilerinin tanımlı olduğu dosya

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // 📌 SLASH KOMUTLAR
      if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;

        // ✅ Sunucu sahibi ise direkt çalıştır
        if (interaction.guild?.ownerId === interaction.user.id) {
          const cmd = client.commands.get(commandName);
          if (cmd) await cmd.execute(interaction);
          return;
        }

        // 📌 Yetki seviyesi belirle
        const memberRoles = interaction.member.roles.cache.map(r => r.name);
        let seviye = null;
        if (memberRoles.some(r => config.roles?.ust?.includes(r))) seviye = "ust";
        else if (memberRoles.some(r => config.roles?.orta?.includes(r))) seviye = "orta";
        else if (memberRoles.some(r => config.roles?.alt?.includes(r))) seviye = "alt";

        if (!seviye) {
          return interaction.reply({ content: "🚫 Bu komutu kullanmak için yetkin yok.", ephemeral: true });
        }

        if (!Array.isArray(config.commands?.[seviye]) || !config.commands[seviye].includes(commandName)) {
          return interaction.reply({ content: "🚫 Bu komut senin yetki seviyene kapalı.", ephemeral: true });
        }

        // 📌 Komutu çalıştır
        const cmd = client.commands.get(commandName);
        if (!cmd) return;
        try {
          await cmd.execute(interaction);
        } catch (err) {
          console.error(`❌ Komut hatası:`, err);
          if (!interaction.replied) {
            await interaction.reply({ content: '❌ Komut çalıştırılamadı.', ephemeral: true });
          }
        }
      }

      // 📌 TICKET BUTONU
      else if (interaction.isButton() && interaction.customId === 'ticket_olustur') {
        const existing = interaction.guild.channels.cache.find(c =>
          c.name === `ticket-${interaction.user.id}`
        );
        if (existing) {
          return interaction.reply({
            content: `❌ Zaten açık bir biletin var: ${existing}`,
            ephemeral: true
          });
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory
              ],
            },
          ],
        });

        await channel.send({
          content: `${interaction.user}`,
          embeds: [
            new EmbedBuilder()
              .setTitle('🎫 Destek Talebi Oluşturuldu')
              .setDescription('👋 Merhaba! Lütfen yaşadığınız sorunu detaylıca yazın.\nYetkililer en kısa sürede yardımcı olacaktır.')
              .setColor('Blue')
          ]
        });

        return interaction.reply({
          content: `✅ Bilet başarıyla oluşturuldu: ${channel}`,
          ephemeral: true
        });
      }

    } catch (err) {
      console.error('interactionCreate genel hata:', err);
      if (
        interaction.type === InteractionType.ApplicationCommand &&
        !interaction.replied
      ) {
        await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
      }
    }
  }
};
