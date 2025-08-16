const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('telsiz')
        .setDescription('Telsiz kanalı açar veya kapatır.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('aç')
                .setDescription('Telsiz kanalı açar ve isminizi telsiz koduna çevirir.')
                .addStringOption(option =>
                    option.setName('telsiz_kodu')
                        .setDescription('Telsiz kodunuz (örn: 10-09)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('rütbe')
                        .setDescription('Askeri rütbeniz (örn: Teğmen)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kapat')
                .setDescription('Telsiz kanalını kapatır ve isminizi eski haline getirir.')),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member;

        if (subcommand === 'aç') {
            const telsizKodu = interaction.options.getString('telsiz_kodu');
            const rutbe = interaction.options.getString('rütbe');
            const newNickname = `${rutbe ? `[${rutbe}] ` : ''}Telsiz ${telsizKodu}`;

            try {
                // Üyenin takma adını değiştir
                await member.setNickname(newNickname);

                // Ses kanalı oluştur ve üyeyi o kanala taşı
                const voiceChannel = await interaction.guild.channels.create({
                    name: `Telsiz - ${telsizKodu}`,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: member.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                        },
                    ],
                });

                if (member.voice.channel) {
                    await member.voice.setChannel(voiceChannel);
                }

                await interaction.reply({ content: `✅ Telsiz kanalı (**${voiceChannel.name}**) açıldı. Takma adınız **${newNickname}** olarak değiştirildi.`, ephemeral: true });

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Telsiz kanalı açılırken bir hata oluştu. Botun gerekli yetkilere sahip olduğundan emin olun.', ephemeral: true });
            }

        } else if (subcommand === 'kapat') {
            const voiceChannel = member.voice.channel;

            if (!voiceChannel || !voiceChannel.name.startsWith('Telsiz -')) {
                return interaction.reply({ content: '❌ Bir telsiz kanalında değilsiniz.', ephemeral: true });
            }

            try {
                // Telsiz kanalını sil
                await voiceChannel.delete();
                
                // Üyenin takma adını eski haline getir (eğer yetkisi varsa)
                if (member.manageable) {
                    await member.setNickname(null);
                }

                await interaction.reply({ content: '✅ Telsiz kanalı başarıyla kapatıldı. Takma adınız eski haline döndürüldü.', ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Telsiz kanalı kapatılırken bir hata oluştu.', ephemeral: true });
            }
        }
    }
};
