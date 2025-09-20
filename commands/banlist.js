const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Sunucudaki yasaklı kullanıcıları listeler')
        .addIntegerOption(option =>
            option.setName('sayfa')
                .setDescription('Gösterilecek sayfa numarası')
                .setMinValue(1)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const page = interaction.options.getInteger('sayfa') || 1;
        const itemsPerPage = 10;

        try {
            // Yasaklı kullanıcıları getir
            const bans = await interaction.guild.bans.fetch();
            
            if (bans.size === 0) {
                const noBansEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Yasaklı Kullanıcı Listesi')
                    .setDescription('Bu sunucuda yasaklı kullanıcı bulunmamaktadır.');
                
                return interaction.reply({ embeds: [noBansEmbed] });
            }

            // Sayfalama hesaplamaları
            const totalPages = Math.ceil(bans.size / itemsPerPage);
            
            if (page > totalPages) {
                return interaction.reply({ content: `Geçersiz sayfa numarası. Toplam sayfa sayısı: ${totalPages}`, ephemeral: true });
            }

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            
            // Yasaklı kullanıcıları diziye çevir ve sayfalama uygula
            const banArray = Array.from(bans.values()).slice(startIndex, endIndex);
            
            // Embed oluştur
            const banListEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Yasaklı Kullanıcı Listesi')
                .setDescription(`Toplam yasaklı kullanıcı: ${bans.size}`)
                .setFooter({ text: `Sayfa ${page}/${totalPages}` })
                .setTimestamp();

            // Her yasaklı kullanıcı için field ekle
            banArray.forEach((ban, index) => {
                const user = ban.user;
                const reason = ban.reason || 'Sebep belirtilmedi';
                const banNumber = startIndex + index + 1;
                
                banListEmbed.addFields({
                    name: `${banNumber}. ${user.tag}`,
                    value: `**ID:** ${user.id}\n**Sebep:** ${reason}`,
                    inline: false
                });
            });

            await interaction.reply({ embeds: [banListEmbed] });

        } catch (error) {
            console.error('Banlist hatası:', error);
            await interaction.reply({ content: 'Yasaklı kullanıcı listesi alınırken bir hata oluştu.', ephemeral: true });
        }
    },
};
