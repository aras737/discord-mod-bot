const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("duyuru")
        .setDescription("Sunucudaki herkese DM'den ultra havalı embed duyuru gönderir.")
        .addStringOption(option =>
            option
                .setName("mesaj")
                .setDescription("Gönderilecek duyuru mesajı")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const mesaj = interaction.options.getString("mesaj");

        // 🔥 Premium embed
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${interaction.guild.name} Resmi Duyuru`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTitle("🌟 **Yeni Bir Duyuru Yayınlandı!**")
            .setDescription(`> ${mesaj}`)
            .setColor("#f7b731")
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setImage("https://i.imgur.com/UYF9K5F.gif") // Premium banner
            .setFooter({
                text: "Bu bildirim sunucu yönetimi tarafından gönderildi.",
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Kullanıcıya bilgi
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("📤 Duyuru Başlatıldı")
                    .setDescription("Tüm üyelere güvenli şekilde DM gönderiliyor...")
                    .setColor("#4b7bec")
            ],
            ephemeral: true
        });

        let basarili = 0, basarisiz = 0;
        let basarisizListe = [];

        const members = await interaction.guild.members.fetch();

        // SPAM ÖNLEME → Hem güvenli hem Railway çökmez
        for (const member of members.values()) {
            if (member.user.bot) continue;

            try {
                await member.send({ embeds: [embed] });
                basarili++;
            } catch {
                basarisiz++;
                basarisizListe.push(`<@${member.user.id}>`);
            }

            await new Promise(res => setTimeout(res, 250)); // DM flood koruması
        }

        // Sonuç embed’i
        const resultEmbed = new EmbedBuilder()
            .setTitle("📨 Duyuru Gönderildi")
            .setColor("Green")
            .setDescription(
                `**Gönderilen:** ${basarili} üye\n` +
                `**DM Kapalı / Hata:** ${basarisiz} üye`
            )
            .setTimestamp();

        await interaction.followUp({
            embeds: [resultEmbed],
            ephemeral: true
        });

        // Sunucu kanalına duyuru gönder
        interaction.channel.send({ embeds: [embed] });

        // Hatalı kullanıcıları logla
        if (basarisiz > 0) {
            const hataEmbed = new EmbedBuilder()
                .setTitle("❌ DM Gönderilemeyen Kullanıcılar")
                .setColor("Red")
                .setDescription(
                    basarisizListe.length > 0
                        ? basarisizListe.join("\n")
                        : "Tüm DM'ler başarıyla gönderildi!"
                );

            interaction.channel.send({ embeds: [hataEmbed] });
        }
    }
};
