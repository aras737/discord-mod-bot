const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('telsiz')
        .setDescription('Telsiz kanalı açar veya kapatır.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .addSubcommand(sub =>
            sub.setName('aç')
                .setDescription('Telsiz kanalı açar ve isminizi telsiz koduna çevirir.')
                .addStringOption(opt =>
                    opt.setName('telsiz_kodu')
                        .setDescription('Telsiz kodunuz (örn: 10-09)')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('rütbe')
                        .setDescription('Askeri rütbeniz (örn: Teğmen)')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('kapat')
                .setDescription('Telsiz kanalını kapatır ve isminizi eski haline getirir.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;
        const member = guild.members.cache.get(interaction.user.id);

        if (subcommand === 'aç') {
            const telsizKodu = interaction.options.getString('telsiz_kodu');
            const rutbe = interaction.options.getString('rütbe');
            const newNickname = `${rutbe ? `[${rutbe}] ` : ''}Telsiz ${telsizKodu}`;

            try {
                if (member.manageable) {
                    await member.setNickname(newNickname);
                }

                const voiceChannel = await guild.channels.create({
                    name: `📡 Telsiz - ${telsizKodu}`,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.Connect], // Herkese kapalı
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

                await interaction.reply({
                    content: `✅ Telsiz kanalı **${voiceChannel.name}** açıldı. Takma adınız **${newNickname}** olarak değiştirildi.`,
                    ephemeral: true
                });

            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Telsiz kanalı açılırken bir hata oluştu. Botun gerekli yetkilere sahip olduğundan emin olun.',
                    ephemeral: true
                });
            }
        }

        if (subcommand === 'kapat') {
            const voiceChannel = member.voice.channel;

            if (!voiceChannel || !voiceChannel.name.startsWith('📡 Telsiz -')) {
                return interaction.reply({
                    content: '❌ Bir telsiz kanalında değilsiniz.',
                    ephemeral: true
                });
            }

            try {
                if (voiceChannel.deletable) {
                    await voiceChannel.delete();
                }

                if (member.manageable) {
                    await member.setNickname(null);
                }

                await interaction.reply({
                    content: '✅ Telsiz kanalı kapatıldı ve takma adınız eski haline döndü.',
                    ephemeral: true
                });

            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Telsiz kanalı kapatılırken hata oluştu.',
                    ephemeral: true
                });
            }
        }
    }
};
