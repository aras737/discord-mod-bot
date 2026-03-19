require("dotenv").config()
const { 
Client, 
GatewayIntentBits, 
SlashCommandBuilder 
} = require("discord.js")

const db = require("croxydb")
const fs = require("fs")

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

/* =========================
   YETKİ (ERENSİ SİSTEM)
========================= */
function yetkili(member){
  return member.permissions.has("ManageMessages") || 
         member.permissions.has("Administrator")
}

/* =========================
   READY + SLASH YÜKLEME
========================= */
client.once("ready", async () => {

console.log("✅ Sicil sistemi aktif")

await client.application.commands.set([
  new SlashCommandBuilder()
  .setName("dosya")
  .setDescription("Sicil dosyası gönderir")
  .addStringOption(o=>o.setName("isim").setRequired(true))
])

})

/* =========================
   MESAJ OKUMA (TUTANAK)
========================= */
client.on("messageCreate", async message => {

if(message.author.bot || !message.guild) return
if(!yetkili(message.member)) return

const text = message.content

// sadece bu satır varsa çalışır
if(!text.includes("Tutanak tutulan kişi:")) return

try{

const kişi = text.split("Tutanak tutulan kişi:")[1].split("\n")[0].trim()

const sebep = text.includes("Sebep:")
  ? text.split("Sebep:")[1].split("\n")[0].trim()
  : "Belirtilmedi"

const ceza = text.includes("Verilecek ceza miktarı:")
  ? text.split("Verilecek ceza miktarı:")[1].split("\n")[0].trim()
  : "Yok"

const tutan = text.includes("Tutanak tutan:")
  ? text.split("Tutanak tutan:")[1].split("\n")[0].trim()
  : message.author.tag

const tarih = new Date().toLocaleString("tr-TR")

// 📂 SİCİL
let kayıt = db.get(`sicil_${kişi}`) || []

kayıt.push({
sebep,
ceza,
tutan,
tarih
})

db.set(`sicil_${kişi}`, kayıt)

// ✅ tik
message.react("✅")

}catch(err){
console.log("Hata:", err)
}

})

/* =========================
   SLASH KOMUT (/dosya)
========================= */
client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return

if(!yetkili(interaction.member)){
  return interaction.reply({content:"❌ Yetkin yok", ephemeral:true})
}

if(interaction.commandName === "dosya"){

const isim = interaction.options.getString("isim")
const kayıt = db.get(`sicil_${isim}`)

if(!kayıt || kayıt.length === 0){
  return interaction.reply("❌ Sicil yok")
}

let text = `SİCİL: ${isim}\n\n`

kayıt.forEach((x,i)=>{
text += `
${i+1})
Sebep: ${x.sebep}
Ceza: ${x.ceza}
Veren: ${x.tutan}
Tarih: ${x.tarih}
----------------
`
})

// TXT oluştur
const path = `./${isim}.txt`
fs.writeFileSync(path, text)

// DM gönder
await interaction.user.send({
files:[path]
}).catch(()=>{})

interaction.reply("📁 Sicil DM gönderildi")

}

})

client.login(process.env.TOKEN)
