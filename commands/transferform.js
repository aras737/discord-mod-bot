require("dotenv").config()
const { Client, GatewayIntentBits } = require("discord.js")
const db = require("croxydb")
const fs = require("fs")

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

// 🔒 ADMIN ROL ID
const ADMIN_ROLE = "1465758739645731022"

// =================
// MESAJ OKUMA
// =================
client.on("messageCreate", async message => {

if(message.author.bot) return
if(!message.guild) return

// sadece admin
if(!message.member.roles.cache.has(ADMIN_ROLE)) return

const content = message.content

// FORMAT KONTROL
if(
content.includes("Tutanak tutan:") &&
content.includes("Tutanak tutulan kişi:") &&
content.includes("Sebep:") &&
content.includes("Verilecek ceza miktarı:")
){

try{

// VERİ ÇEK
const tutan = content.split("Tutanak tutan:")[1].split("\n")[0].trim()
const kişi = content.split("Tutanak tutulan kişi:")[1].split("\n")[0].trim()
const sebep = content.split("Sebep:")[1].split("\n")[0].trim()
const ceza = content.split("Verilecek ceza miktarı:")[1].split("\n")[0].trim()

const tarih = new Date().toLocaleString("tr-TR")

// KAYDET
let kayıt = db.get(`dosya_${kişi}`) || []

kayıt.push({
tutan,
sebep,
ceza,
tarih
})

db.set(`dosya_${kişi}`, kayıt)

// ✅ TEPKİ
message.react("✅")

// BOT MESAJI
message.reply(`✅ Tutanak onaylandı\n👮 ${tutan}`)

}catch(err){
console.log(err)
}

}

})

// =================
// LİSTE KOMUTU
// =================
client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return

// /liste
if(interaction.commandName === "liste"){

const isim = interaction.options.getString("isim")
const kayıt = db.get(`dosya_${isim}`)

if(!kayıt) return interaction.reply("❌ Kayıt yok")

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

if(!kayıt) return interaction.reply("❌ Kayıt yok")

let text = `DOSYA: ${isim}\n\n`

kayıt.forEach((x,i)=>{
text += `
${i+1})
Tutan: ${x.tutan}
Sebep: ${x.sebep}
Ceza: ${x.ceza}
Tarih: ${x.tarih}
------------------
`
})

// TXT oluştur
fs.writeFileSync(`./${isim}.txt`, text)

// DM gönder
interaction.user.send({
files:[`./${isim}.txt`]
}).catch(()=>{})

interaction.reply("📁 Dosya DM gönderildi")

}

})

client.login(process.env.TOKEN)
