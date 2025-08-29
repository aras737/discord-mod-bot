// commands/kurulum-askeri.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

// ====== Yardımcılar ======
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function owDenyAll(guildId) {
  return [{ id: guildId, deny: [PermissionFlagsBits.ViewChannel] }];
}
function owReadWrite(role) {
  return role ? [{ id: role.id, allow: [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.UseExternalEmojis,
  ] }] : [];
}
function owReadOnly(role) {
  return role ? [{ id: role.id, allow: [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ReadMessageHistory,
  ] }] : [];
}

async function createCategory(guild, name, overwrites = [], reason = "Askeri Kurulum") {
  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: overwrites,
    reason,
  });
}
async function createText(guild, parentId, name, overwrites = [], topic = null, slow = 0, reason = "Askeri Kurulum") {
  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parentId,
    topic,
    rateLimitPerUser: slow,
    permissionOverwrites: overwrites,
    reason,
  });
}
async function createVoice(guild, parentId, name, overwrites = [], reason = "Askeri Kurulum") {
  return guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parentId,
    permissionOverwrites: overwrites,
    reason,
  });
}

async function dm(user, title, desc) {
  const embed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle(title)
    .setDescription(desc)
    .setTimestamp();
  try { await user.send({ embeds: [embed] }); } catch (error) { console.error(`DM gönderilirken bir hata oluştu: ${error.message}`); }
}

// ====== Rütbeler (gerçeğe uygun, çok ayrıntılı) ======
// Not: Renkler temsili; hiyerarşi üstten alta.
const COLORS = {
  GENEL: "#b71c1c",
  SUBAY: "#d32f2f",
  ASTSUBAY: "#7b1fa2",
  UZMAN_ERBAS: "#303f9f",
  ER_ERBAS: "#455a64",
  YONETIM: "#37474f",
  BRANS: "#1565c0",
  OZEL_BIRIM: "#2e7d32",
};

// Branşlara özel detaylı birimler ve rolleri
const BRANS_OZELLER_DETAYLI = {
  kara: {
    piyade: [
      { name: "Piyade Tugay Komutanı", color: COLORS.SUBAY },
      { name: "Piyade Tabur Komutanı", color: COLORS.SUBAY },
      { name: "Piyade Takım Komutanı", color: COLORS.ASTSUBAY },
      { name: "Piyade Mangası", color: COLORS.ER_ERBAS },
    ],
    zirhli: [
      { name: "Zırhlı Birlikler Komutanı", color: COLORS.SUBAY },
      { name: "Tank Mürettebat Komutanı", color: COLORS.ASTSUBAY },
      { name: "Tank Nişancısı", color: COLORS.UZMAN_ERBAS },
      { name: "Zırhlı Birlik Personeli", color: COLORS.ER_ERBAS },
    ],
    lojsitik: [
      { name: "Lojistik Şube Müdürü", color: COLORS.SUBAY },
      { name: "İkmal Astsubayı", color: COLORS.ASTSUBAY },
      { name: "Ulaştırma Uzmanı", color: COLORS.UZMAN_ERBAS },
    ],
  },
  deniz: {
    filo: [
      { name: "Filo Komutanı", color: COLORS.SUBAY },
      { name: "Filo Başçavuşu", color: COLORS.ASTSUBAY },
      { name: "Muharip Gemi Personeli", color: COLORS.ER_ERBAS },
      { name: "Destek Gemisi Personeli", color: COLORS.ER_ERBAS },
    ],
    denizalti: [
      { name: "Denizaltı Komutanı", color: COLORS.SUBAY },
      { name: "Denizaltı Başçavuşu", color: COLORS.ASTSUBAY },
      { name: "Denizaltı Operatörü", color: COLORS.UZMAN_ERBAS },
    ],
    amfibi: [
      { name: "Amfibi Deniz Piyade Komutanı", color: COLORS.SUBAY },
      { name: "Amfibi Tim Lideri", color: COLORS.ASTSUBAY },
      { name: "Amfibi Personeli", color: COLORS.ER_ERBAS },
    ],
  },
  hava: {
    savas_ucaklari: [
      { name: "Savaş Uçakları Filo Komutanı", color: COLORS.SUBAY },
      { name: "F-16 Filo Komutanı", color: COLORS.SUBAY },
      { name: "Pilot Yüzbaşı", color: COLORS.SUBAY },
      { name: "Pilot Teğmen", color: COLORS.SUBAY },
    ],
    helikopter: [
      { name: "Helikopter Filo Komutanı", color: COLORS.SUBAY },
      { name: "Helikopter Pilotu", color: COLORS.SUBAY },
      { name: "Helikopter Teknisyeni", color: COLORS.ASTSUBAY },
    ],
    mak: [
      { name: "MAK Tim Komutanı", color: COLORS.SUBAY },
      { name: "MAK Personeli", color: COLORS.UZMAN_ERBAS },
      { name: "Hava Kuvvetleri MAK", color: COLORS.OZEL_BIRIM },
    ],
  },
  jandarma: {
    asayis: [
      { name: "Asayiş Komutanı", color: COLORS.SUBAY },
      { name: "Asayiş Tim Lideri", color: COLORS.ASTSUBAY },
      { name: "Asayiş Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
      { name: "Asayiş Eri", color: COLORS.ER_ERBAS },
    ],
    komando: [
      { name: "Jandarma Komando Komutanı", color: COLORS.SUBAY },
      { name: "Jandarma Komando Tim Lideri", color: COLORS.ASTSUBAY },
      { name: "Jandarma Komando Eri", color: COLORS.ER_ERBAS },
    ],
    kriminal: [
      { name: "Olay Yeri İnceleme Subayı", color: COLORS.SUBAY },
      { name: "Kriminal Uzmanı", color: COLORS.ASTSUBAY },
    ],
  },
  ozel: {
    kara_ozel: [
      { name: "ÖKK Operasyon Komutanı", color: COLORS.SUBAY },
      { name: "ÖKK Takım Lideri", color: COLORS.ASTSUBAY },
      { name: "ÖKK Operatörü", color: COLORS.UZMAN_ERBAS },
    ],
    deniz_ozel: [
      { name: "SAT Komutanı", color: COLORS.SUBAY },
      { name: "SAS Komutanı", color: COLORS.SUBAY },
      { name: "SAT/SAS Operatörü", color: COLORS.UZMAN_ERBAS },
      { name: "SAT/SAS", color: COLORS.OZEL_BIRIM },
    ],
    hava_ozel: [
      { name: "Hava Kuvvetleri Özel Birlik Komutanı", color: COLORS.SUBAY },
      { name: "Hava Operatörü", color: COLORS.UZMAN_ERBAS },
    ],
  },
  inzibat: {
    devriye: [
      { name: "İnzibat Devriye Amiri", color: COLORS.ASTSUBAY },
      { name: "İnzibat Ekip Lideri", color: COLORS.ASTSUBAY },
      { name: "İnzibat Eri", color: COLORS.ER_ERBAS },
    ],
    merkez: [
      { name: "İnzibat Merkez Komutanı", color: COLORS.SUBAY },
      { name: "İnzibat Gözlem Astsubayı", color: COLORS.ASTSUBAY },
    ],
  },
  sinir: {
    devriye: [
      { name: "Sınır Devriye Komutanı", color: COLORS.SUBAY },
      { name: "Sınır Tim Amiri", color: COLORS.ASTSUBAY },
      { name: "Sınır Bekçisi", color: COLORS.UZMAN_ERBAS },
    ],
    pasaport: [
      { name: "Gümrük ve Pasaport Şefi", color: COLORS.SUBAY },
      { name: "Pasaport Kontrol Astsubayı", color: COLORS.ASTSUBAY },
      { name: "Gümrük İşlemleri Uzmanı", color: COLORS.UZMAN_ERBAS },
    ],
  },
};

const ROL_SETS = {
  // Yönetim ve omurga (her şablonda lazım)
  _omurga: [
    { name: "Genelkurmay Başkanı", color: COLORS.GENEL },
    { name: "Kuvvet Komutanı", color: COLORS.GENEL },
    { name: "Kurmay Başkanı", color: COLORS.YONETIM },
    { name: "Disiplin Kurulu", color: COLORS.YONETIM },
    { name: "Eğitim Başkanlığı", color: COLORS.YONETIM },
    { name: "Lojistik Başkanlığı", color: COLORS.YONETIM },
  ],

  kara: [
    { name: "Mareşal", color: COLORS.GENEL },
    { name: "Orgeneral", color: COLORS.GENEL },
    { name: "Korgeneral", color: COLORS.GENEL },
    { name: "Tümgeneral", color: COLORS.SUBAY },
    { name: "Tuğgeneral", color: COLORS.SUBAY },
    { name: "Kurmay Albay", color: COLORS.SUBAY },
    { name: "Albay", color: COLORS.SUBAY },
    { name: "Yarbay", color: COLORS.SUBAY },
    { name: "Binbaşı", color: COLORS.SUBAY },
    { name: "Yüzbaşı", color: COLORS.SUBAY },
    { name: "Üsteğmen", color: COLORS.SUBAY },
    { name: "Teğmen", color: COLORS.SUBAY },
    { name: "Asteğmen", color: COLORS.SUBAY },
    { name: "Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Onbaşı", color: COLORS.ASTSUBAY },
    { name: "Sözleşmeli Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Sözleşmeli Uzman Onbaşı", color: COLORS.UZMAN_ERBAS },
    { name: "Uzman Erbaş", color: COLORS.UZMAN_ERBAS },
    { name: "Sözleşmeli Erbaş", color: COLORS.UZMAN_ERBAS },
    { name: "Er", color: COLORS.ER_ERBAS },
    { name: "Acemi Er", color: COLORS.ER_ERBAS },
    { name: "Yedek Subay Adayı", color: COLORS.ER_ERBAS },
    { name: "Askeri Öğrenci", color: COLORS.ER_ERBAS },
    ...BRANS_OZELLER_DETAYLI.kara.piyade,
    ...BRANS_OZELLER_DETAYLI.kara.zirhli,
    ...BRANS_OZELLER_DETAYLI.kara.lojsitik,
    { name: "Kara Kuvvetleri", color: COLORS.BRANS },
  ],

  deniz: [
    { name: "Büyükamiral", color: COLORS.GENEL },
    { name: "Oramiral", color: COLORS.GENEL },
    { name: "Koramiral", color: COLORS.GENEL },
    { name: "Tümamiral", color: COLORS.SUBAY },
    { name: "Tuğamiral", color: COLORS.SUBAY },
    { name: "Deniz Kurmay Albay", color: COLORS.SUBAY },
    { name: "Deniz Albay", color: COLORS.SUBAY },
    { name: "Deniz Yarbay", color: COLORS.SUBAY },
    { name: "Deniz Binbaşı", color: COLORS.SUBAY },
    { name: "Deniz Yüzbaşı", color: COLORS.SUBAY },
    { name: "Deniz Üsteğmen", color: COLORS.SUBAY },
    { name: "Deniz Teğmen", color: COLORS.SUBAY },
    { name: "Deniz Asteğmen", color: COLORS.SUBAY },
    { name: "Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Çavuş", color: COLORS.ASTSUBAY },
    { name: "Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Uzman Erbaş", color: COLORS.UZMAN_ERBAS },
    { name: "Deniz Piyadesi", color: COLORS.ER_ERBAS },
    { name: "Deniz Er", color: COLORS.ER_ERBAS },
    { name: "Acemi Deniz Er", color: COLORS.ER_ERBAS },
    ...BRANS_OZELLER_DETAYLI.deniz.filo,
    ...BRANS_OZELLER_DETAYLI.deniz.denizalti,
    ...BRANS_OZELLER_DETAYLI.deniz.amfibi,
    { name: "Deniz Kuvvetleri", color: COLORS.BRANS },
  ],

  hava: [
    { name: "Hava Orgeneral", color: COLORS.GENEL },
    { name: "Hava Korgeneral", color: COLORS.GENEL },
    { name: "Hava Tümgeneral", color: COLORS.SUBAY },
    { name: "Hava Tuğgeneral", color: COLORS.SUBAY },
    { name: "Hava Kurmay Albay", color: COLORS.SUBAY },
    { name: "Hava Pilot Albay", color: COLORS.SUBAY },
    { name: "Hava Yarbay", color: COLORS.SUBAY },
    { name: "Hava Pilot Binbaşı", color: COLORS.SUBAY },
    { name: "Hava Yüzbaşı", color: COLORS.SUBAY },
    { name: "Hava Pilot Üsteğmen", color: COLORS.SUBAY },
    { name: "Hava Teğmen", color: COLORS.SUBAY },
    { name: "Hava Asteğmen", color: COLORS.SUBAY },
    { name: "Uçak Bakım Astsubayı", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Çavuş", color: COLORS.ASTSUBAY },
    { name: "Hava Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Hava Erbaş", color: COLORS.ER_ERBAS },
    { name: "Hava Er", color: COLORS.ER_ERBAS },
    ...BRANS_OZELLER_DETAYLI.hava.savas_ucaklari,
    ...BRANS_OZELLER_DETAYLI.hava.helikopter,
    ...BRANS_OZELLER_DETAYLI.hava.mak,
    { name: "Hava Kuvvetleri", color: COLORS.BRANS },
  ],

  jandarma: [
    { name: "Jandarma Orgeneral", color: COLORS.GENEL },
    { name: "Jandarma Korgeneral", color: COLORS.GENEL },
    { name: "Jandarma Kurmay Albay", color: COLORS.SUBAY },
    { name: "Jandarma Albay", color: COLORS.SUBAY },
    { name: "Jandarma Kurmay Yarbay", color: COLORS.SUBAY },
    { name: "Jandarma Yarbay", color: COLORS.SUBAY },
    { name: "Jandarma Binbaşı", color: COLORS.SUBAY },
    { name: "Jandarma Yüzbaşı", color: COLORS.SUBAY },
    { name: "Jandarma Üsteğmen", color: COLORS.SUBAY },
    { name: "Jandarma Teğmen", color: COLORS.SUBAY },
    { name: "Jandarma Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Jandarma Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Jandarma Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Jandarma Asayiş Timi", color: COLORS.ASTSUBAY },
    { name: "Jandarma Astsubay Çavuş", color: COLORS.ASTSUBAY },
    { name: "Jandarma Devriye Komutanı", color: COLORS.ASTSUBAY },
    { name: "Jandarma Uzman Jandarma", color: COLORS.UZMAN_ERBAS },
    { name: "Jandarma Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Jandarma Erbaş", color: COLORS.ER_ERBAS },
    { name: "Jandarma Er", color: COLORS.ER_ERBAS },
    ...BRANS_OZELLER_DETAYLI.jandarma.asayis,
    ...BRANS_OZELLER_DETAYLI.jandarma.komando,
    ...BRANS_OZELLER_DETAYLI.jandarma.kriminal,
    { name: "Jandarma", color: COLORS.BRANS },
  ],

  ozel: [
    { name: "Özel Kuvvetler Komutanı", color: COLORS.GENEL },
    { name: "ÖKK Kurmay Başkanı", color: COLORS.SUBAY },
    { name: "ÖKK Operasyon Şefi", color: COLORS.SUBAY },
    { name: "Özel Harekat Komutanı", color: COLORS.SUBAY },
    { name: "Özel Harekat Başçavuşu", color: COLORS.ASTSUBAY },
    { name: "Özel Harekat Uzmanı", color: COLORS.UZMAN_ERBAS },
    ...BRANS_OZELLER_DETAYLI.ozel.kara_ozel,
    ...BRANS_OZELLER_DETAYLI.ozel.deniz_ozel,
    ...BRANS_OZELLER_DETAYLI.ozel.hava_ozel,
    { name: "Özel Kuvvetler", color: COLORS.BRANS },
  ],

  inzibat: [
    { name: "İnzibat Orgeneral", color: COLORS.GENEL },
    { name: "İnzibat Korgeneral", color: COLORS.GENEL },
    { name: "İnzibat Tümgeneral", color: COLORS.SUBAY },
    { name: "İnzibat Albay", color: COLORS.SUBAY },
    { name: "İnzibat Yarbay", color: COLORS.SUBAY },
    { name: "İnzibat Binbaşı", color: COLORS.SUBAY },
    { name: "İnzibat Yüzbaşı", color: COLORS.SUBAY },
    { name: "İnzibat Üsteğmen", color: COLORS.SUBAY },
    { name: "İnzibat Teğmen", color: COLORS.SUBAY },
    { name: "İnzibat Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "İnzibat Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "İnzibat Astsubay Çavuş", color: COLORS.ASTSUBAY },
    { name: "İnzibat Ekip Lideri", color: COLORS.ASTSUBAY },
    { name: "İnzibat Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "İnzibat Eri", color: COLORS.ER_ERBAS },
    ...BRANS_OZELLER_DETAYLI.inzibat.devriye,
    ...BRANS_OZELLER_DETAYLI.inzibat.merkez,
    { name: "Askeri İnzibat", color: COLORS.BRANS },
  ],

  sinir: [
    { name: "Sınır Kontrol Komutanı", color: COLORS.GENEL },
    { name: "Sınır Albay", color: COLORS.SUBAY },
    { name: "Sınır Yarbay", color: COLORS.SUBAY },
    { name: "Sınır Binbaşı", color: COLORS.SUBAY },
    { name: "Sınır Yüzbaşı", color: COLORS.SUBAY },
    { name: "Sınır Üsteğmen", color: COLORS.SUBAY },
    { name: "Sınır Teğmen", color: COLORS.SUBAY },
    { name: "Sınır Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Sınır Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Sınır Gözetleme Astsubayı", color: COLORS.ASTSUBAY },
    { name: "Sınır Devriye Eri", color: COLORS.ER_ERBAS },
    { name: "Sınır Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Sınır Eri", color: COLORS.ER_ERBAS },
    ...BRANS_OZELLER_DETAYLI.sinir.devriye,
    ...BRANS_OZELLER_DETAYLI.sinir.pasaport,
    { name: "Sınır Müfettişleri", color: COLORS.BRANS },
  ],
};

// ====== Branş kanal planları ======
function plan(brans, seviye, guildId, roles) {
  const full = seviye === "tam";
  const mid  = seviye === "orta";
  const ustKomuta = [
    roles["Genelkurmay Başkanı"],
    roles["Kuvvet Komutanı"],
    roles["Kurmay Başkanı"],
  ].filter(Boolean);

  const branchName = ({
    kara: "Kara Kuvvetleri",
    deniz: "Deniz Kuvvetleri",
    hava: "Hava Kuvvetleri",
    jandarma: "Jandarma",
    ozel: "Özel Kuvvetler",
    inzibat: "Askeri İnzibat",
    sinir: "Sınır Müfettişleri",
  })[brans];

  const branşRol = roles[branchName];

  const OW_PUBLIC   = [];
  const OW_RESTRICT = [...owDenyAll(guildId), ...owReadWrite(branşRol), ...owReadWrite(roles["Disiplin Kurulu"]), ...owReadWrite(roles["Eğitim Başkanlığı"]), ...ustKomuta.map(r=>({ id:r.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages]}))];
  const OW_COMMAND  = [...owDenyAll(guildId), ...owReadWrite(roles["Kuvvet Komutanı"]), ...owReadWrite(roles["Kurmay Başkanı"]), ...ustKomuta.map(r=>({ id:r.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages]}))];
  const OW_LOGS     = [...owDenyAll(guildId), ...owReadOnly(roles["Disiplin Kurulu"]), ...ustKomuta.map(r=>({ id:r.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]}))];

  const ortak = [
    {
      cat: "Genel",
      ow: OW_PUBLIC,
      texts: ["kurallar", "duyurular", "sohbet", "medya", ...(mid || full ? ["yardim-masasi"] : [])],
      voices: ["Genel Ses"],
    },
    {
      cat: "Komuta",
      ow: OW_COMMAND,
      texts: ["emirler", "görev-planı", ...(mid || full ? ["durum-raporları"] : []), ...(full ? ["operasyon-günlüğü"] : [])],
      voices: ["Komuta Merkezi"],
    },
    {
      cat: "Eğitim",
      ow: OW_RESTRICT,
      texts: ["eğitim-duyuruları", "eğitim-notları", "yoklama", ...(full ? ["terfi-değerlendirme"] : [])],
      voices: ["Eğitim Alanı"],
    },
    {
      cat: "Kayıt ve Log",
      ow: OW_LOGS,
      texts: ["başvurular", "başvuru-log", "disiplin-kayıt", "sunucu-log", ...(mid || full ? ["ticket-log"] : [])],
      voices: [],
    },
  ];

  const spesifik = {
    kara: [
      { cat: "Kara Karargah", ow: OW_RESTRICT, texts: ["lojistik-ihtiyaç", "mühimmat-durumu", "keşif-raporları"], voices: ["Kara Karargah"] },
      { cat: "Piyade Birliği", ow: owReadWrite(roles["Piyade Tugay Komutanı"]), texts: ["piyade-tabur-raporları", "saha-gözlem"], voices: ["Piyade Hattı", "Piyade Operasyon"] },
      { cat: "Zırhlı Birlikler", ow: owReadWrite(roles["Zırhlı Birlikler Komutanı"]), texts: ["tank-raporları", "harekat-planı"], voices: ["Tank Operasyon"] },
      { cat: "Lojistik Birimi", ow: owReadWrite(roles["Lojistik Şube Müdürü"]), texts: ["ikmal-talepleri", "bakım-günlüğü"], voices: ["Lojistik Merkezi"] },
    ],
    deniz: [
      { cat: "Deniz Komuta", ow: OW_RESTRICT, texts: ["filo-raporları", "liman-planı"], voices: ["Köprüüstü"] },
      { cat: "Muharip Filo", ow: owReadWrite(roles["Filo Komutanı"]), texts: ["muharip-gemiler", "deniz-harekat"], voices: ["Filo Kanalı"] },
      { cat: "Denizaltı Birliği", ow: owReadWrite(roles["Denizaltı Komutanı"]), texts: ["denizaltı-raporları"], voices: ["Denizaltı Kanalı"] },
      { cat: "Amfibi Birimler", ow: owReadWrite(roles["Amfibi Deniz Piyade Komutanı"]), texts: ["amfibi-saha", "çıkartma-planları"], voices: ["Çıkartma Botu"] },
    ],
    hava: [
      { cat: "Hava Komuta", ow: OW_RESTRICT, texts: ["uçuş-emirleri", "filo-raporları"], voices: ["Uçuş Kulesi"] },
      { cat: "Savaş Uçakları Filosu", ow: owReadWrite(roles["Savaş Uçakları Filo Komutanı"]), texts: ["f16-raporları", "uçuş-planları"], voices: ["Savaş Uçağı Telsiz"] },
      { cat: "Helikopter Filosu", ow: owReadWrite(roles["Helikopter Filo Komutanı"]), texts: ["helikopter-görevleri", "saha-raporları"], voices: ["Helikopter Telsiz"] },
      { cat: "MAK Birimi", ow: owReadWrite(roles["MAK Tim Komutanı"]), texts: ["mak-harekat", "mak-raporları"], voices: ["Hava Operasyon"] },
    ],
    jandarma: [
      { cat: "Jandarma Merkez", ow: OW_RESTRICT, texts: ["devriye-planı", "karakol-raporları"], voices: ["Karargah"] },
      { cat: "Asayiş Birimi", ow: owReadWrite(roles["Asayiş Komutanı"]), texts: ["asayiş-raporları", "devriye-günlüğü"], voices: ["Asayiş Telsiz"] },
      { cat: "Komando Birliği", ow: owReadWrite(roles["Jandarma Komando Komutanı"]), texts: ["komando-harekat", "saha-raporları"], voices: ["Komando Telsiz"] },
      { cat: "Kriminal Birim", ow: owReadWrite(roles["Olay Yeri İnceleme Subayı"]), texts: ["olay-yeri-raporları"], voices: ["Kriminal Analiz"] },
    ],
    ozel: [
      { cat: "ÖKK Komuta", ow: OW_COMMAND, texts: ["operasyon-emirleri", "hedef-dosyaları"], voices: ["Operasyon Odası"] },
      { cat: "Kara Özel Birimleri", ow: owReadWrite(roles["ÖKK Operasyon Komutanı"]), texts: ["kara-operasyonları", "gözlem-kayıtları"], voices: ["Kara Telsiz"] },
      { cat: "Deniz Özel Birimleri", ow: owReadWrite(roles["SAT Komutanı"]), texts: ["sat-raporları", "sualtı-görevler"], voices: ["Su Altı Operasyon"] },
      { cat: "Hava Özel Birimleri", ow: owReadWrite(roles["Hava Kuvvetleri Özel Birlik Komutanı"]), texts: ["hava-harekatı", "gözetleme-kayıtları"], voices: ["Hava Operasyon"] },
    ],
    inzibat: [
      { cat: "İnzibat Komuta", ow: OW_COMMAND, texts: ["emirler", "devriye-planı", "ceza-kayıtları"], voices: ["İnzibat Merkez"] },
      { cat: "Devriye Birimi", ow: owReadWrite(roles["İnzibat Devriye Amiri"]), texts: ["devriye-raporları", "olay-günlüğü"], voices: ["Devriye Kanalı"] },
      { cat: "Merkez Birimi", ow: owReadWrite(roles["İnzibat Merkez Komutanı"]), texts: ["merkez-raporları", "güvenlik-kamerası"], voices: ["Merkez Yönetim"] },
    ],
    sinir: [
      { cat: "Sınır Komuta", ow: OW_COMMAND, texts: ["sınır-talimatları", "nokta-raporları"], voices: ["Komuta Merkezi"] },
      { cat: "Sınır Devriye Birimi", ow: owReadWrite(roles["Sınır Devriye Komutanı"]), texts: ["devriye-raporları", "gözlem-kayıtları"], voices: ["Devriye Hattı"] },
      { cat: "Gümrük ve Pasaport Birimi", ow: owReadWrite(roles["Gümrük ve Pasaport Şefi"]), texts: ["pasaport-kontrol", "gümrük-islemleri"], voices: ["Gümrük Hattı"] },
    ],
  };

  return [...ortak, ...(spesifik[brans] || [])];
}

// ====== Komut ======
module.exports = {
  data: new SlashCommandBuilder()
    .setName("kurulum-askeri")
    .setDescription("Gerçekçi askeri şablon kurar. Uyarı: İsteğe bağlı sıfırlama ile mevcut yapıyı silebilir.")
    .addStringOption(o =>
      o.setName("brans")
        .setDescription("Kurulacak branş")
        .setRequired(true)
        .addChoices(
          { name: "Hepsi", value: "hepsi" },
          { name: "Kara Kuvvetleri", value: "kara" },
          { name: "Deniz Kuvvetleri", value: "deniz" },
          { name: "Hava Kuvvetleri", value: "hava" },
          { name: "Jandarma", value: "jandarma" },
          { name: "Özel Kuvvetler", value: "ozel" },
          { name: "Askeri İnzibat", value: "inzibat" },
          { name: "Sınır Müfettişleri", value: "sinir" },
        )
    )
    .addStringOption(o =>
      o.setName("seviye")
        .setDescription("Detay seviyesi")
        .setRequired(true)
        .addChoices(
          { name: "Temel", value: "temel" },
          { name: "Orta", value: "orta" },
          { name: "Tam", value: "tam" },
        )
    )
    .addBooleanOption(o =>
      o.setName("sifirla")
        .setDescription("Mevcut kanalları ve (botun yetkisi dâhilindeki) rolleri sil")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const me = guild.members.me;
    const owner = await guild.fetchOwner();
    const brans = interaction.options.getString("brans");
    const seviye = interaction.options.getString("seviye");
    const sifirla = interaction.options.getBoolean("sifirla");

    await interaction.reply({ content: `Kurulum başladı. Branş: ${brans}, Seviye: ${seviye}. Aşamalar DM ile bildirilecek.`, ephemeral: true });

    // Yetki kontrolü
    const need = [
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.Administrator,
    ];
    const ok = me.permissions.has(need);
    if (!ok) {
      await interaction.followUp({ content: "Gerekli yetkiler eksik. Yönetim, Rol, Kanal ve Yönetici yetkileri gerekir.", ephemeral: true });
      return;
    }

    // Sıfırla
    if (sifirla) {
      await dm(owner.user, "Kurulum Raporu", "Sıfırlama başlatıldı: Kanallar temizleniyor.");
      for (const ch of [...guild.channels.cache.values()]) {
        try { await ch.delete("Askeri kurulum: sıfırla"); } catch (error) { console.error(`Kanal silinirken bir hata oluştu: ${error.message}`); }
        await wait(30);
      }
      
      await dm(owner.user, "Kurulum Raporu", "Roller temizleniyor.");
      const myTop = me.roles.highest?.position ?? 0;
      let deletedRoles = 0;
      let skippedRoles = [];
      for (const role of [...guild.roles.cache.values()]) {
        if (role.id === guild.id) continue;
        if (role.managed) {
          skippedRoles.push(`(Yönetilen) ${role.name}`);
          continue;
        }
        if (role.position >= myTop) {
          skippedRoles.push(`(Yetki) ${role.name}`);
          continue;
        }
        try { 
          await role.delete("Askeri kurulum: sıfırla");
          deletedRoles++;
        } catch (error) { 
          skippedRoles.push(`(Hata) ${role.name}`);
          console.error(`Rol silinirken bir hata oluştu: ${role.name} - ${error.message}`); 
        }
        await wait(30);
      }
      await dm(owner.user, "Kurulum Raporu", "Sıfırlama tamamlandı.");
    } else {
      await dm(owner.user, "Kurulum Raporu", "Sıfırlama kapalı. Mevcut yapı korunacak.");
    }

    // Rol oluşturma
    await dm(owner.user, "Kurulum Raporu", "Roller oluşturuluyor…");
    const roles = {};
    const rolesToCreate = [
      ...ROL_SETS._omurga,
    ];
    const targets = brans === "hepsi" ? ["kara","deniz","hava","jandarma","ozel","inzibat","sinir"] : [brans];
    for(const key of targets) {
      rolesToCreate.push(...ROL_SETS[key]);
    }

    for (const r of rolesToCreate) {
      if (roles[r.name]) continue;
      const created = await guild.roles.create({ name: r.name, color: r.color, reason: "Askeri kurulum" }).catch(error => { console.error(`Rol oluşturulurken bir hata oluştu: ${error.message}`); return null; });
      if (created) roles[r.name] = created;
      await wait(25);
    }
    
    // Kanallar
    await dm(owner.user, "Kurulum Raporu", "Kategoriler ve kanallar oluşturuluyor…");
    let createdChannels = 0, createdCats = 0;

    for (const key of targets) {
      const sets = plan(key, seviye, guild.id, roles);
      for (const set of sets) {
        const cat = await createCategory(guild, `${({
          kara: "Kara",
          deniz: "Deniz",
          hava: "Hava",
          jandarma: "Jandarma",
          ozel: "Özel",
          inzibat: "Askeri İnzibat",
          sinir: "Sınır Müfettişleri",
        })[key]} - ${set.cat}`, set.ow).catch(error => { console.error(`Kategori oluşturulurken bir hata oluştu: ${error.message}`); return null; });
        if (!cat) continue;
        createdCats++;

        for (const t of set.texts || []) {
          const ch = await createText(guild, cat.id, t, set.ow).catch(error => { console.error(`Kanal oluşturulurken bir hata oluştu: ${error.message}`); return null; });
          if (ch) createdChannels++;
          await wait(20);
        }
        for (const v of set.voices || []) {
          const ch = await createVoice(guild, cat.id, v, set.ow).catch(error => { console.error(`Ses kanalı oluşturulurken bir hata oluştu: ${error.message}`); return null; });
          if (ch) createdChannels++;
          await wait(20);
        }
      }
    }

    // Son olarak herkese açık "Sosyal" kategori (okunur-yazılır)
    const social = await createCategory(guild, "Sosyal", []).catch(error => { console.error(`Sosyal kategori oluşturulurken bir hata oluştu: ${error.message}`); return null; });
    if (social) {
      await createText(guild, social.id, "sohbet", []);
      await createText(guild, social.id, "komutlar", []);
      await createVoice(guild, social.id, "Genel Ses", []);
      createdCats++; createdChannels += 3;
    }

    // DM özet
    const createdRolesCount = Object.keys(roles).length;
    let finalReport = `Kurulum tamamlandı.
Branş: ${brans}
Seviye: ${seviye}
---
**Sıfırlama Raporu:**
Başarıyla silinen rol sayısı: ${deletedRoles}
Atlanan rol sayısı: ${skippedRoles.length}
Atlanan rollerin listesi:
${skippedRoles.length > 0 ? skippedRoles.map(r => `> ${r}`).join('\n') : '> Yok'}
---
**Yeni Kurulum Raporu:**
Oluşturulan yeni rol sayısı: ${createdRolesCount}
Oluşturulan kategori sayısı: ${createdCats}
Oluşturulan kanal sayısı: ${createdChannels}`;
    
    await dm(owner.user, "Kurulum Tamamlandı", finalReport);

    await interaction.followUp({ content: "Kurulum tamamlandı. Ayrıntılar DM ile gönderildi.", ephemeral: true });
  }
};
