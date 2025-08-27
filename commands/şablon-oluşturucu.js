const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("askeri-template")
    .setDescription("Askeri temalı Discord şablonunu kurar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply({ content: "⚔️ Askeri şablon kuruluyor...", ephemeral: true });

    const guild = interaction.guild;

    // 📌 ROLLER
    const roles = {};
    roles.general = await guild.roles.create({ name: "🪖 General", color: "Red" });
    roles.captain = await guild.roles.create({ name: "🎖️ Captain", color: "Blue" });
    roles.sergeant = await guild.roles.create({ name: "🛡️ Sergeant", color: "Green" });
    roles.soldier = await guild.roles.create({ name: "⚔️ Soldier", color: "Grey" });
    roles.recruit = await guild.roles.create({ name: "🎯 Recruit", color: "White" });

    // 📌 KATEGORİLER & KANALLAR
    const infoCat = await guild.channels.create({
      name: "📜 Bilgilendirme",
      type: 4, // Category
    });
    await guild.channels.create({ name: "📢 Duyurular", type: 0, parent: infoCat.id });
    await guild.channels.create({ name: "📌 Kurallar", type: 0, parent: infoCat.id });
    await guild.channels.create({ name: "🎖️ Rütbeler", type: 0, parent: infoCat.id });

    const generalCat = await guild.channels.create({
      name: "💬 Genel",
      type: 4,
    });
    await guild.channels.create({ name: "💂 Sohbet", type: 0, parent: generalCat.id });
    await guild.channels.create({ name: "🎙️ Sesli Sohbet", type: 2, parent: generalCat.id });

    const militaryCat = await guild.channels.create({
      name: "⚔️ Askeri Alan",
      type: 4,
    });
    await guild.channels.create({ name: "🪖 Emirler", type: 0, parent: militaryCat.id });
    await guild.channels.create({ name: "📋 Eğitimler", type: 0, parent: militaryCat.id });
    await guild.channels.create({ name: "🗺️ Operasyonlar", type: 0, parent: militaryCat.id });
    await guild.channels.create({ name: "🎧 Karargah", type: 2, parent: militaryCat.id });

    const branchesCat = await guild.channels.create({
      name: "🏅 Branşlar",
      type: 4,
    });
    await guild.channels.create({ name: "✈️ Hava Kuvvetleri", type: 0, parent: branchesCat.id });
    await guild.channels.create({ name: "🚢 Deniz Kuvvetleri", type: 0, parent: branchesCat.id });
    await guild.channels.create({ name: "🪖 Kara Kuvvetleri", type: 0, parent: branchesCat.id });
    await guild.channels.create({ name: "🎯 Özel Kuvvetler", type: 0, parent: branchesCat.id });

    // 📌 BİTİR
    await interaction.followUp({ content: "✅ Askeri Discord şablonu başarıyla kuruldu!" });
  }
};
