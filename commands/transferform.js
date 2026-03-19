require("dotenv").config()
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js")
const db = require("croxydb")
const fs = require("fs")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

/* =========================
   YETKİ SİSTEMİ (ERENSİ)
========================= */
function yetkiliMi(member){
  return member.permissions.has("ManageMessages") || 
         member.permissions.has("Administrator")
}

/* =========================
   READY + SLASH
========================= */
client.once("ready", async () => {

  console.log("✅ TFA Tutanak Aktif")

  await client.application.commands.set([
    new SlashCommandBuilder()
    .setName("liste")
    .setDescription("Kayıtları gösterir")
    .addStringOption(o=>o.setName("isim").setRequired(true)),

    new SlashCommandBuilder()
    .setName("dosya")
    .setDescription("TXT dosya gönderir")
    .addStringOption(o=>o.setName("isim").setRequired(true))
  ])
})

/* =========================
   MESAJ OKUMA (ANA SİSTEM)
========================= */
client.on("messageCreate", async message => {

if(message.author.bot || !message.guild) return

// ❌ yetki yoksa çık
if(!yetkiliMi(message.member)) return

const text = message.content

// 📌 FORMAT KONTROL
const gerekli = [
"Tutanak tutan:",
"Tutanak tutulan kişi:",
"Sebep:",
"Verilecek ceza miktarı:",
"Tag:"
]

const doğruFormat = gerekli.every(x => text.includes(x))

if(!doğruFormat){
  return message.reply("❌ Format hatalı!\nDoğru formatı kullan.")
}

// 📸 FOTO KONTROL
if(message.attachments.size === 0){
  return message.reply("❌ Fotoğraf zorunlu!")
}

try{

// 📌 VERİ PARSE
const tutan = text.split("Tutanak tutan:")[1].split("\n")[0].trim()
const kişi = text.split("Tutanak tutulan kişi:")[1].split("\n")[0].trim()
const sebep = text.split("Sebep:")[1].split("\n")[0].trim()
const ceza = text.split("Verilecek ceza miktarı:")[1].split("\n")[0].trim()
const tag = text.split("Tag:")[1].split("\n")[0].trim()

const foto = message.attachments.first().url
const tarih = new Date().toLocaleString("tr-TR")

// 📂 KAYIT
let kayıt = db.get(`dosya_${kişi}`) || []

kayıt.push({
tutan,
sebep,
ceza,
tarih,
tag,
foto
})

db.set(`dosya_${kişi}`, kayıt)

// ✅ TEPKİ
message.react("✅")

// 🔥 ONAY MESAJI
message.reply(`✅ Tutanak kaydedildi
👮 Tutan: ${tutan}
👤 Kişi: ${kişi}`)

}catch(err){
console.log(err)
message.reply("❌ Veri okunamadı")
}

})

/* =========================
   SLASH KOMUTLAR
========================= */
client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return

// ❌ yetki kontrol
if(!yetkiliMi(interaction.member)){
  return interaction.reply({content:"❌ Yetkin yok", ephemeral:true})
}

// =================
// LİSTE
// =================
if(interaction.commandName === "liste"){

const isim = interaction.options.getString("isim")
const kayıt = db.get(`dosya_${isim}`)

if(!kayıt || kayıt.length === 0){
return interaction.reply("❌ Kayıt yok")
}

let text = ""

kayıt.forEach((x,i)=>{
text += `${i+1}) ${x.sebep} | ${x.ceza} | ${x.tarih}\n`
})

interaction.reply(text.slice(0,2000))
}

// =================
// DOSYA (TXT)
// =================
if(interaction.commandName === "dosya"){

const isim = interaction.options.getString("isim")
const kayıt = db.get(`dosya_${isim}`)

if(!kayıt || kayıt.length === 0){
return interaction.reply("❌ Kayıt yok")
}

let text = `DOSYA: ${isim}\n\n`

kayıt.forEach((x,i)=>{
text += `
${i+1})
Tutan: ${x.tutan}
Sebep: ${x.sebep}
Ceza: ${x.ceza}
Tag: ${x.tag}
Tarih: ${x.tarih}
Foto: ${x.foto}
------------------
`
})

// 📁 DOSYA OLUŞTUR
const path = `./${isim}.txt`
fs.writeFileSync(path, text)

// 📩 DM GÖNDER
interaction.user.send({
files:[path]
}).catch(()=>{})

interaction.reply("📁 Dosya DM gönderildi")
}

})

client.login(process.env.TOKEN)
