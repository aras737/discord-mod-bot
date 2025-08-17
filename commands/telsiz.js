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

        // 🔒 Botun gerekli yetkilerini kontrol et
        const neededPermissions = [
            PermissionsBitField.Flags.ManageNicknames,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
        ];

        if (!interaction.guild.members.me.permissions.has(neededPermissions)) {
            return interaction.reply({
                content: '❌ Botun gerekli yetkileri yok. Lütfen şu yetkileri verin:\n' +
                    '`Manage Nicknames`, `Manage Channels`, `Move Members`, `Connect`, `Speak`',
                ephemeral: true
            });
        }

        if (subcommand === 'aç') {
            const telsizKodu = interaction.options.getString('telsiz_kodu');
            const rutbe = interaction.options.getString('rütbe');
            const newNickname = `${rutbe ? `[${rutbe}] ` : ''}Telsiz ${telsizKodu}`;

            try {
                // 📝 Nickname değiştir
                if (member.manageable) {
                    await member.setNickname(newNickname);
                }

                // 🎙️ Ses kanalı oluştur
                const voiceChannel = await interaction.guild.channels.create({
                    name: `📞 Telsiz - ${telsizKodu}`,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.Connect], // Herkes giremesin
                        },
                        {
                            id: member.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                        },
                    ],
                });

                // Kullanıcı zaten ses kanalındaysa -> yeni kanala taşı
                if (member.voice.channel) {
                    await member.voice.setChannel(voiceChannel);
                }

                await interaction.reply({
                    content: `✅ Telsiz kanalı (**${voiceChannel.name}**) açıldı.\nTakma adınız **${newNickname}** olarak ayarlandı.`,
                    ephemeral: true
                });

            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Telsiz kanalı açılırken hata oluştu. Botun yetkilerini kontrol edin.',
                    ephemeral: true
                });
            }

        } else if (subcommand === 'kapat') {
            const voiceChannel = member.voice.channel;

            if (!voiceChannel || !voiceChannel.name.startsWith('📻 Telsiz -')) {
                return interaction.reply({ content: '❌ Bir telsiz kanalında değilsiniz.', ephemeral: true });
            }

            try {
                // 🎙️ Kanalı sil
                await voiceChannel.delete();

                // 📝 Nick eski haline döner
                if (member.manageable) {
                    await member.setNickname(null);
                }

                await interaction.reply({
                    content: '✅ Telsiz kapatıldı. Takma adınız eski haline döndü.',
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Telsiz kapatılamadı. Botun yetkilerini kontrol edin.',
                    ephemeral: true
                });
            }
        }
    }
};
