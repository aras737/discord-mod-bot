const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sunucu")
        .setDescription("Sunucu hakkında detaylı bilgileri gösterir"),

    async execute(interaction) {
        const { guild } = interaction;

        // Üye sayıları
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status === "online").size;
        const idleMembers = guild.members.cache.filter(m => m.presence?.status === "idle").size;
        const dndMembers = guild.members.cache.filter(m => m.presence?.status === "dnd").size;
        const offlineMembers = totalMembers - (onlineMembers + idleMembers + dndMembers);

        // Kanal sayıları
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;

        // Roller
        const rolesCount = guild.roles.cache.size;

        // Boost seviyesi
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount;

        // AFK kanalı
        const afkChannel = guild.afkChannel ? `<#${guild.afkChannel.id}>` : "❌ Yok";

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`📊 ${guild.name} Sunucu Bilgileri`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: "👑 Sunucu Sahibi", value: `<@${guild.ownerId}>`, inline: true },
                { name: "🆔 Sunucu ID", value: guild.id, inline: true },
                { name: "📆 Kuruluş Tarihi", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },

                { name: "👥 Üyeler", value: `
Toplam: **${totalMembers}**
🟢 Online: **${onlineMembers}**
🌙 Idle: **${idleMembers}**
⛔ DND: **${dndMembers}**
⚫ Offline: **${offlineMembers}**
                `, inline: false },

                { name: "📑 Kanallar", value: `
📝 Yazı: **${textChannels}**
🔊 Ses: **${voiceChannels}**
📂 Kategori: **${categories}**
                `, inline: false },

                { name: "🎭 Roller", value: `${rolesCount} rol var`, inline: true },
                { name: "🚀 Boost", value: `Seviye: **${boostLevel}**\nBoost Sayısı: **${boostCount}**`, inline: true },
                { name: "💤 AFK Kanalı", value: afkChannel, inline: true }
            )
            .setFooter({ text: `${guild.name} Sunucu Yönetim Sistemi` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
