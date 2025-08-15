const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kilavuz')
        .setDescription('Branş/Birim kılavuzunu DM üzerinden gönderir.'),

    async execute(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('kilavuz_select')
            .setPlaceholder('Branş veya birim seçiniz...')
            .addOptions([
                {
                    label: 'Sınır Müfettişleri',
                    description: 'Sınır Müfettişleri alım kılavuzu',
                    value: 'sm_kilavuz'
                },
                {
                    label: 'Diğer Branş',
                    description: 'Başka bir branşın kılavuzu',
                    value: 'diger_kilavuz'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: '📜 Lütfen kılavuzunu görmek istediğiniz branşı seçin:',
            components: [row],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000,
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async i => {
            if (i.customId === 'kilavuz_select') {
                let title = '';
                let text = '';

                if (i.values[0] === 'sm_kilavuz') {
                    title = 'Sınır Müfettişleri Alım Kılavuzu';
                    text = `Buraya uzun SM kılavuz metnini koyacağız...`; // Buraya tam metni ekle
                } else if (i.values[0] === 'diger_kilavuz') {
                    title = 'Diğer Branş Kılavuzu';
                    text = `Buraya diğer branşın kılavuzu gelecek...`;
                }

                const chunks = text.match(/[\s\S]{1,4000}/g) || [];

                try {
                    for (let idx = 0; idx < chunks.length; idx++) {
                        const embed = new EmbedBuilder()
                            .setTitle(`${title} ${chunks.length > 1 ? `(Bölüm ${idx + 1})` : ''}`)
                            .setDescription(chunks[idx])
                            .setColor(0x00AE86);

                        await interaction.user.send({ embeds: [embed] });
                    }

                    await i.reply({
                        content: `📩 **${title}** kılavuzu DM'ne gönderildi.`,
                        ephemeral: true
                    });
                } catch {
                    await i.reply({
                        content: '❌ Sana DM gönderemedim. DM’lerin açık olduğundan emin ol.',
                        ephemeral: true
                    });
                }

                collector.stop();
            }
        });
    }
};
