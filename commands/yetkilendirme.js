[
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Kullanıcıyı Discord yasaklar sistemine işler")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("kullanici").setDescription("Yasaklanacak üye").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Yasaklama sebebi").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ban-listesi")
    .setDescription("Discord'daki orijinal yasaklılar listesini gösterir")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("egitim-kitapcigi")
    .setDescription("Eğitim kitapçıklarını listeler"),

  new SlashCommandBuilder()
    .setName("madalya-sistemi")
    .setDescription("Madalya ve nişan sistemini gösterir")
]
