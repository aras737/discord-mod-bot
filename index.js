const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// ─────────────── KOMUTLARI YÜKLE ───────────────
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Komut yüklendi: ${file}`);
    } else {
        console.log(`⚠️ Hatalı komut atlandı: ${file}`);
    }
}

// ─────────────── BOT BAŞLATILDI ───────────────
client.once("ready", () => {
    console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// ─────────────── INTERACTIONLAR ───────────────
client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Komut çalıştırılırken hata oluştu.", ephemeral: true });
        }
    }

    // 🎟 Bilet oluşturma
    if (interaction.isButton()) {
        if (interaction.customId === "create_ticket") {
            const guild = interaction.guild;
            const member = interaction.member;

            // kategori bul / oluştur
            let category = guild.channels.cache.find(c => c.name === "🎟・DESTEK" && c.type === 4);
            if (!category) {
                category = await guild.channels.create({
                    name: "🎟・DESTEK",
                    type: 4
                });
            }

            // Zaten bilet var mı kontrol et
            const existing = guild.channels.cache.find(c => c.name === `ticket-${member.user.username.toLowerCase()}`);
            if (existing) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("⚠️ Hata")
                            .setDescription("Zaten açık bir biletiniz var!")
                    ],
                    ephemeral: true
                });
            }

            // Kanal oluştur
            const channel = await guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: 0,
                parent: category.id,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setAuthor({ name: "🎟 Destek Sistemi", iconURL: guild.iconURL() })
                .setTitle("Bilet Açıldı ✅")
                .setDescription("Merhaba! Yetkililer en kısa sürede sizinle ilgilenecektir.\n\nBileti kapatmak için aşağıdaki butona basabilirsiniz.")
                .setThumbnail(member.displayAvatarURL())
                .setFooter({ text: "TPA TKA Yönetim Botu", iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("close_ticket")
                    .setLabel("🔒 Bileti Kapat")
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `<@${member.id}> 🎟 Bilet açıldı!`, embeds: [embed], components: [row] });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setDescription(`✅ Biletiniz başarıyla açıldı: ${channel}`)
                ],
                ephemeral: true
            });
        }

        // 🔒 Bilet kapatma
        if (interaction.customId === "close_ticket") {
            const channel = interaction.channel;

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle("🔒 Bilet Kapatılıyor")
                        .setDescription("Bilet 5 saniye içinde kapanacaktır...")
                ]
            });

            setTimeout(() => {
                channel.delete().catch(() => { });
            }, 5000);
        }
    }
});

// ─────────────── BOT GİRİŞ ───────────────
client.login(process.env.TOKEN);
