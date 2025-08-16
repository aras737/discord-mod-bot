const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

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
                .setDescription('Telsiz kanalını kapatır ve kapanma sesi çalar.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member;

        if (subcommand === 'aç') {
            const telsizKodu = interaction.options.getString('telsiz_kodu');
            const rutbe = interaction.options.getString('rütbe');
            const newNickname = `${rutbe ? `[${rutbe}] ` : ''}Telsiz ${telsizKodu}`;

            try {
                await member.setNickname(newNickname);

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

                await interaction.reply({ content: `📡 Telsiz kanalı **${voiceChannel.name}** açıldı. Takma adınız **${newNickname}** olarak değiştirildi.`, ephemeral: true });

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Telsiz kanalı açılırken hata oluştu.', ephemeral: true });
            }
        }

        if (subcommand === 'kapat') {
            const voiceChannel = member.voice.channel;
            if (!voiceChannel || !voiceChannel.name.startsWith('Telsiz -')) {
                return interaction.reply({ content: '❌ Bir telsiz kanalında değilsiniz.', ephemeral: true });
            }

            try {
                // Önce kapanma sesi çal
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                const resource = createAudioResource(path.join(__dirname, 'telsiz.mp3')); // Ses dosyasını aynı klasöre koy
                const player = createAudioPlayer();

                player.play(resource);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, async () => {
                    connection.destroy(); // Ses bitince çık
                    await voiceChannel.delete(); // Kanalı sil
                    if (member.manageable) await member.setNickname(null);
                });

                await interaction.reply({ content: '📴 Telsiz kapatılıyor... **kkkkkk**', ephemeral: true });

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Telsiz kapatılırken hata oluştu.', ephemeral: true });
            }
        }
    },
};
