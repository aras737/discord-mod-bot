import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";
import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from "discord.js";

// .env yükle
dotenv.config();

// __dirname çözümü (ESM’de default yok)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Client oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const commands = [];

// 🔹 Yapay Zeka Komutu (direkt index içine gömülü)
const yapayZekaCommand = {
  data: new SlashCommandBuilder()
    .setName("yapayzeka")
    .setDescription("Yapay zekaya soru sor")
    .addStringOption(option =>
      option
        .setName("soru")
        .setDescription("Sorunu buraya yaz")
        .setRequired(true)
    ),
  async execute(interaction) {
    const soru = interaction.options.getString("soru");
    await interaction.deferReply();

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: soru }],
      });

      const cevap = completion.choices[0].message.content;
      await interaction.editReply(cevap);
    } catch (err) {
      console.error("❌ OpenAI hatası:", err);
      await interaction.editReply("Bir hata oluştu 😢");
    }
  }
};

// Komutları ekle
client.commands.set(yapayZekaCommand.data.name, yapayZekaCommand);
commands.push(yapayZekaCommand.data.toJSON());

// Komutları klasörden yükle (varsa)
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = await import(path.join(commandsPath, file));
    if ("data" in command.default && "execute" in command.default) {
      client.commands.set(command.default.data.name, command.default);
      commands.push(command.default.data.toJSON());
      console.log(`✅ Komut yüklendi: ${command.default.data.name}`);
    } else {
      console.log(`⚠️ Komut eksik: ${file}`);
    }
  }
}

// Komutları Discord'a kaydet
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log("✅ Slash komutları başarıyla yüklendi.");
  } catch (err) {
    console.error(err);
  }
});

// Interaction event
client.on(Events.InteractionCreate, async interaction => {
  // Slash Komutlar
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "❌ Bir hata oluştu!", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Bir hata oluştu!", ephemeral: true });
      }
    }
  }

  // 🎟️ Bilet oluşturma
  if (interaction.isButton() && interaction.customId === "create_ticket") {
    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({ content: `❌ Zaten açık biletin var: ${existing}`, ephemeral: true });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: 0, // Text channel
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
      ],
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Kapat")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `🎟️ Merhaba ${interaction.user}, sorununu buraya yazabilirsin.`,
      components: [row],
    });

    await interaction.reply({ content: `✅ Bilet açıldı: ${channel}`, ephemeral: true });
  }

  // 📌 Bilet kapatma
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    if (!interaction.channel.name.startsWith("ticket-")) {
      return interaction.reply({ content: "❌ Bu buton sadece bilet kanallarında çalışır.", ephemeral: true });
    }

    await interaction.reply({ content: "📌 Bilet kapatılıyor...", ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 3000);
  }
});

client.login(process.env.TOKEN);
