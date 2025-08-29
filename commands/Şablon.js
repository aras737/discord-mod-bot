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

// ====== Rütbeler (gerçeğe uygun ayrıntılı) ======
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

// Özel branş rolleri
const BRANS_OZELLER = {
  komando: [
    { name: "Komando Tugay Komutanı", color: COLORS.SUBAY },
    { name: "Komando Tabur Komutanı", color: COLORS.SUBAY },
    { name: "Komando Bölük Komutanı", color: COLORS.SUBAY },
    { name: "Komando Tim Lideri", color: COLORS.ASTSUBAY },
    { name: "Komando Uzman Erbaş", color: COLORS.UZMAN_ERBAS },
    { name: "Komando Er", color: COLORS.ER_ERBAS },
    { name: "Jandarma Komando", color: COLORS.OZEL_BIRIM },
  ],
  mak: [
    { name: "MAK Tim Komutanı", color: COLORS.SUBAY },
    { name: "MAK Personel Subayı", color: COLORS.SUBAY },
    { name: "MAK Astsubayı", color: COLORS.ASTSUBAY },
    { name: "MAK Personeli", color: COLORS.UZMAN_ERBAS },
    { name: "Hava Kuvvetleri MAK", color: COLORS.OZEL_BIRIM },
  ],
  satas: [
    { name: "SAT Grup Komutanı", color: COLORS.SUBAY },
    { name: "SAT Grup Lideri", color: COLORS.ASTSUBAY },
    { name: "SAT Operatörü", color: COLORS.UZMAN_ERBAS },
    { name: "SAS Tim Lideri", color: COLORS.ASTSUBAY },
    { name: "SAS Operatörü", color: COLORS.UZMAN_ERBAS },
    { name: "Deniz Kuvvetleri SAT/SAS", color: COLORS.OZEL_BIRIM },
  ],
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
    // General/subay
    { name: "Mareşal", color: COLORS.GENEL },
    { name: "Orgeneral", color: COLORS.GENEL },
    { name: "Korgeneral", color: COLORS.GENEL },
    { name: "Tümgeneral", color: COLORS.SUBAY },
    { name: "Tuğgeneral", color: COLORS.SUBAY },
    { name: "Kurmay Albay", color: COLORS.SUBAY },
    { name: "Albay", color: COLORS.SUBAY },
    { name: "Kurmay Yarbay", color: COLORS.SUBAY },
    { name: "Yarbay", color: COLORS.SUBAY },
    { name: "Kurmay Binbaşı", color: COLORS.SUBAY },
    { name: "Binbaşı", color: COLORS.SUBAY },
    { name: "Yüzbaşı", color: COLORS.SUBAY },
    { name: "Üsteğmen", color: COLORS.SUBAY },
    { name: "Teğmen", color: COLORS.SUBAY },
    { name: "Asteğmen", color: COLORS.SUBAY },
    // Astsubay
    { name: "Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Onbaşı", color: COLORS.ASTSUBAY },
    // Uzman/Erbaş/Er
    { name: "Sözleşmeli Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Sözleşmeli Uzman Onbaşı", color: COLORS.UZMAN_ERBAS },
    { name: "Uzman Erbaş", color: COLORS.UZMAN_ERBAS },
    { name: "Sözleşmeli Erbaş", color: COLORS.UZMAN_ERBAS },
    { name: "Sözleşmeli Er", color: COLORS.ER_ERBAS },
    { name: "Er", color: COLORS.ER_ERBAS },
    { name: "Acemi Er", color: COLORS.ER_ERBAS },
    { name: "Yedek Subay Adayı", color: COLORS.ER_ERBAS },
    { name: "Askeri Öğrenci", color: COLORS.ER_ERBAS },
    // Branş ana rol
    { name: "Kara Kuvvetleri", color: COLORS.BRANS },
  ],

  deniz: [
    // Amiraller
    { name: "Büyükamiral", color: COLORS.GENEL },
    { name: "Oramiral", color: COLORS.GENEL },
    { name: "Koramiral", color: COLORS.GENEL },
    { name: "Tümamiral", color: COLORS.SUBAY },
    { name: "Tuğamiral", color: COLORS.SUBAY },
    // Subay
    { name: "Deniz Kurmay Albay", color: COLORS.SUBAY },
    { name: "Deniz Albay", color: COLORS.SUBAY },
    { name: "Deniz Yarbay", color: COLORS.SUBAY },
    { name: "Deniz Binbaşı", color: COLORS.SUBAY },
    { name: "Deniz Yüzbaşı", color: COLORS.SUBAY },
    { name: "Deniz Üsteğmen", color: COLORS.SUBAY },
    { name: "Deniz Teğmen", color: COLORS.SUBAY },
    { name: "Deniz Asteğmen", color: COLORS.SUBAY },
    // Astsubay
    { name: "Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Çavuş", color: COLORS.ASTSUBAY },
    // Erbaş/Er
    { name: "Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Uzman Erbaş", color: COLORS.UZMAN_ERBAS },
    { name: "Deniz Piyadesi", color: COLORS.ER_ERBAS },
    { name: "Deniz Er", color: COLORS.ER_ERBAS },
    { name: "Acemi Deniz Er", color: COLORS.ER_ERBAS },
    { name: "Deniz Kuvvetleri", color: COLORS.BRANS },
  ],

  hava: [
    // Generaller
    { name: "Hava Orgeneral", color: COLORS.GENEL },
    { name: "Hava Korgeneral", color: COLORS.GENEL },
    { name: "Hava Tümgeneral", color: COLORS.SUBAY },
    { name: "Hava Tuğgeneral", color: COLORS.SUBAY },
    // Subaylar
    { name: "Hava Kurmay Albay", color: COLORS.SUBAY },
    { name: "Hava Pilot Albay", color: COLORS.SUBAY },
    { name: "Hava Yarbay", color: COLORS.SUBAY },
    { name: "Hava Pilot Binbaşı", color: COLORS.SUBAY },
    { name: "Hava Yüzbaşı", color: COLORS.SUBAY },
    { name: "Hava Pilot Üsteğmen", color: COLORS.SUBAY },
    { name: "Hava Teğmen", color: COLORS.SUBAY },
    { name: "Hava Asteğmen", color: COLORS.SUBAY },
    // Astsubaylar
    { name: "Uçak Bakım Astsubayı", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Başçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Üstçavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Kıdemli Çavuş", color: COLORS.ASTSUBAY },
    { name: "Astsubay Çavuş", color: COLORS.ASTSUBAY },
    // Erbaş/Er
    { name: "Hava Uzman Çavuş", color: COLORS.UZMAN_ERBAS },
    { name: "Hava Erbaş", color: COLORS.ER_ERBAS },
    { name: "Hava Er", color: COLORS.ER_ERBAS },
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
    // Astsubay
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
    { name: "Jandarma", color: COLORS.BRANS },
  ],

  ozel: [
    { name: "Özel Kuvvetler Komutanı", color: COLORS.GENEL },
    { name: "ÖKK Kurmay Başkanı", color: COLORS.SUBAY },
    { name: "ÖKK Operasyon Şefi", color: COLORS.SUBAY },
    { name: "Özel Harekat Komutanı", color: COLORS.SUBAY },
    { name: "Özel Harekat Başçavuşu", color: COLORS.ASTSUBAY },
    { name: "Özel Harekat Uzmanı", color: COLORS.UZMAN_ERBAS },
    ...BRANS_OZELLER.komando,
    ...BRANS_OZELLER.mak,
    ...BRANS_OZELLER.satas,
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
    { name: "Sınır Müfettişleri", color: COLORS.BRANS },
  ],
};

// ====== Branş kanal planları ======
function plan(brans, seviye, guildId, roles) {
  const full = seviye === "tam";
  const mid  = seviye === "orta";

  // Komuta rol grubu: üst komuta daima görür
  const ustKomuta = [
    roles["Genelkurmay Başkanı"],
    roles["Kuvvet Komutanı"],
    roles["Kurmay Başkanı"],
  ].filter(Boolean);

  // Branş ana rol adı:
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
  const ozelRoller = {
    komando: roles["Jandarma Komando"],
    mak: roles["Hava Kuvvetleri MAK"],
    satas: roles["Deniz Kuvvetleri SAT/SAS"],
  };

  // Overwrite setleri
  const OW_PUBLIC   = []; // herkese açık (sadece okuma değil; burada genel alanı açık bırakacağız)
  const OW_RESTRICT = [...owDenyAll(guildId), ...owReadWrite(branşRol), ...owReadWrite(roles["Disiplin Kurulu"]), ...owReadWrite(roles["Eğitim Başkanlığı"]), ...ustKomuta.map(r=>({ id:r.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages]}))];
  const OW_COMMAND  = [...owDenyAll(guildId), ...owReadWrite(roles["Kuvvet Komutanı"]), ...owReadWrite(roles["Kurmay Başkanı"]), ...ustKomuta.map(r=>({ id:r.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages]}))];
  const OW_LOGS     = [...owDenyAll(guildId), ...owReadOnly(roles["Disiplin Kurulu"]), ...ustKomuta.map(r=>({ id:r.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]}))];

  // Ortak kategoriler (her branşta)
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

  // Branşa özgü
  const spesifik = {
    kara: [
      { cat: "Kara Karargah", ow: OW_RESTRICT, texts: ["tabur-raporları", "lojistik-ihtiyaç", ...(full ? ["mühimmat"] : [])], voices: ["Kara Karargah"] },
      { cat: "Birlikler", ow: OW_RESTRICT, texts: ["zırhlı-birlik", "piyade", "topçu", "keşif"], voices: ["Zırhlı Birlik", "Piyade Hattı", "Topçu Hattı"] },
      { cat: "Tatbikat", ow: OW_RESTRICT, texts: ["silah-egitimi", "taktik-egitimi", "harita-strateji"], voices: ["Tatbikat Alanı"] },
    ],
    deniz: [
      { cat: "Deniz Komuta", ow: OW_RESTRICT, texts: ["filo-raporları", "liman-planı"], voices: ["Köprüüstü"] },
      { cat: "Filo", ow: OW_RESTRICT, texts: ["1-filo", "2-filo", "denizaltı-birliği", "güverte", "telsiz"], voices: ["Filo Kanalı", "Denizaltı Kanalı"] },
      { cat: "Deniz Eğitim", ow: OW_RESTRICT, texts: ["denizcilik", "gemi-sistemleri", "harita-deniz"], voices: ["Eğitim Havuzu"] },
    ],
    hava: [
      { cat: "Hava Komuta", ow: OW_RESTRICT, texts: ["uçuş-emirleri", "filo-raporları"], voices: ["Uçuş Kulesi"] },
      { cat: "Filo", ow: OW_RESTRICT, texts: ["1-filo", "2-filo", "helikopter-birliği", "yer-ekibi", "teknisyen"], voices: ["Filo Kanalı", "Uçuş Hazırlık"] },
      { cat: "Simülasyon", ow: OW_RESTRICT, texts: ["uçuş-egitimi", "hava-strateji", "harita-hava"], voices: ["Simülatör"] },
    ],
    jandarma: [
      { cat: "Jandarma Merkez", ow: OW_RESTRICT, texts: ["devriye-planı", "karakol-raporları"], voices: ["Karargah"] },
      { cat: "Saha Operasyon", ow: OW_RESTRICT, texts: ["asayiş", "trafik", "komando"], voices: ["Saha Telsiz"] },
      { cat: "Jandarma Eğitim", ow: OW_RESTRICT, texts: ["eğitim-plan", "raporlar"], voices: ["Eğitim Salonu"] },
    ],
    ozel: [
      { cat: "ÖKK Komuta", ow: OW_COMMAND, texts: ["operasyon-emirleri", "hedef-dosyaları", ...(full ? ["gizli-arsiv"] : [])], voices: ["Operasyon Odası"] },
      { cat: "Komando Birliği", ow: [...owDenyAll(guildId), ...owReadWrite(ozelRoller.komando)], texts: ["komando-raporları", "saha-gözlem"], voices: ["Komando Telsiz"] },
      { cat: "MAK Timleri", ow: [...owDenyAll(guildId), ...owReadWrite(ozelRoller.mak)], texts: ["mak-harekat", "mak-raporları"], voices: ["Hava Operasyon"] },
      { cat: "SAT/SAS", ow: [...owDenyAll(guildId), ...owReadWrite(ozelRoller.satas)], texts: ["sat-raporları", "su-altı-görev"], voices: ["Su Altı Operasyon"] },
    ],
    inzibat: [
      { cat: "Disiplin ve Güvenlik", ow: OW_RESTRICT, texts: ["genel-güvenlik", "disiplin-raporları", "asayiş-kayıtları"], voices: ["Devriye Kanalı"] },
      { cat: "Denetleme", ow: OW_RESTRICT, texts: ["kimlik-kontrolü", "araç-kontrolü", "kışla-denetimi"], voices: ["Denetim Noktası"] },
      { cat: "İnzibat Komuta", ow: OW_COMMAND, texts: ["emirler", "devriye-planı", "ceza-kayıtları"], voices: ["İnzibat Merkez"] },
    ],
    sinir: [
      { cat: "Sınır Komuta", ow: OW_COMMAND, texts: ["sınır-talimatları", "nokta-raporları"], voices: ["Komuta Merkezi"] },
      { cat: "Sınır Devriye", ow: OW_RESTRICT, texts: ["devriye-raporları", "gözlem-kayıtları", "kaçakçılık-müdahale"], voices: ["Devriye Hattı"] },
      { cat: "Gümrük ve Pasaport", ow: OW_RESTRICT, texts: ["pasaport-kontrol", "gümrük-islemleri", "vize-duyuruları"], voices: ["Gümrük Hattı"] },
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
    const ok = need.every(p => me.permissions.has(p));
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
      for (const role of [...guild.roles.cache.values()]) {
        if (role.id === guild.id) continue;         // @everyone
        if (role.managed) continue;                 // entegrasyon rolleri
        if (role.position >= myTop) continue;       // botun üstündeki roller silinemez
        try { await role.delete("Askeri kurulum: sıfırla"); } catch (error) { console.error(`Rol silinirken bir hata oluştu: ${error.message}`); }
        await wait(30);
      }
      await dm(owner.user, "Kurulum Raporu", "Sıfırlama tamamlandı.");
    } else {
      await dm(owner.user, "Kurulum Raporu", "Sıfırlama kapalı. Mevcut yapı korunacak.");
    }

    // Rol oluşturma
    await dm(owner.user, "Kurulum Raporu", "Roller oluşturuluyor…");
    const roles = {};

    // Omurga rolleri
    for (const r of ROL_SETS._omurga) {
      const created = await guild.roles.create({ name: r.name, color: r.color, reason: "Askeri kurulum" }).catch(error => { console.error(`Rol oluşturulurken bir hata oluştu: ${error.message}`); return null; });
      if (created) roles[r.name] = created;
      await wait(25);
    }

    // Seçilen branş(lar)
    const targets = brans === "hepsi" ? ["kara","deniz","hava","jandarma","ozel","inzibat","sinir"] : [brans];
    for (const key of targets) {
      // Önce ana branş rolleri, sonra alt birim rolleri
      for (const r of ROL_SETS[key]) {
        if (roles[r.name]) continue;
        const created = await guild.roles.create({ name: r.name, color: r.color, reason: `Askeri kurulum: ${key}` }).catch(error => { console.error(`Rol oluşturulurken bir hata oluştu: ${error.message}`); return null; });
        if (created) roles[r.name] = created;
        await wait(25);
      }
      // Özel kuvvetler için alt birim rolleri de oluşturulur
      if (key === 'ozel') {
          for (const subKey in BRANS_OZELLER) {
              for (const r of BRANS_OZELLER[subKey]) {
                  if (roles[r.name]) continue;
                  const created = await guild.roles.create({ name: r.name, color: r.color, reason: `Askeri kurulum: ${subKey}` }).catch(error => { console.error(`Alt birim rolü oluşturulurken bir hata oluştu: ${error.message}`); return null; });
                  if (created) roles[r.name] = created;
                  await wait(25);
              }
          }
      }
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
    await dm(owner.user, "Kurulum Tamamlandı", [
      `Branş: ${brans}`,
      `Seviye: ${seviye}`,
      `Oluşturulan roller: ${createdRolesCount}`,
      `Kategoriler: ${createdCats}`,
      `Kanallar: ${createdChannels}`,
      `Düzen ve disiplin uygulanacaktır.`,
    ].join("\n"));

    await interaction.followUp({ content: "Kurulum tamamlandı. Ayrıntılar DM ile gönderildi.", ephemeral: true });
  }
};
