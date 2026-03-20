require("dotenv").config()
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js")
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
   YETKİ
========================= */
function yetkili(member){
  return member.permissions.has("ManageMessages") || 
         member.permissions.has("Administrator")
}

/* =========================
   READY
========================= */
client.once("clientReady", async () => {

console.log("✅ Tutanak sistemi aktif")

await client.application.commands.set([
  new SlashCommandBuilder()
  .setName("log-ayarla")
  .setDescription("Tutanak log kanalını ayarlar")
  .addChannelOption(o =>
    o.setName("kanal")
    .setDescription("Log kanalı")
    .setRequired(true)
  )
])

})

/* =========================
   LOG AYARLAMA
========================= */
client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return

if(interaction.commandName === "log-ayarla"){

if(!yetkili(interaction.member)){
return interaction.reply({content:"❌ Yetki yok", ephemeral:true})
}

const kanal = interaction.options.getChannel("kanal")

db.set(`log_${interaction.guild.id}`, kanal.id)

interaction.reply(`✅ Log kanalı ayarlandı: ${kanal}`)
}

})

/* =========================
   TUTANAK SİSTEMİ (OTOMATİK)
========================= */
client.on("messageCreate", async message => {

if(message.author.bot || !message.guild) return
if(!yetkili(message.member)) return

const text = message.content

// sadece bu varsa çalışır
if(!text.includes("Tutanak tutulan kişi:")) return

// 📸 foto kontrol
if(message.attachments.size === 0){
return message.reply("❌ Fotoğraf zorunlu")
}

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

const foto = message.attachments.first().url

// 📂 SICIL
let kayıt = db.get(`sicil_${kişi}`) || []

kayıt.push({
sebep,
ceza,
tutan,
tarih,
foto
})

db.set(`sicil_${kişi}`, kayıt)

// 📁 TXT GÜNCELLE
let txt = `SİCİL: ${kişi}\n\n`

kayıt.forEach((x,i)=>{
txt += `
${i+1})
Sebep: ${x.sebep}
Ceza: ${x.ceza}
Veren: ${x.tutan}
Tarih: ${x.tarih}
Foto: ${x.foto}
----------------
`
})

fs.writeFileSync(`./${kişi}.txt`, txt)

// 📤 LOG KANALI
const logID = db.get(`log_${message.guild.id}`)
const logKanal = message.guild.channels.cache.get(logID)

if(logKanal){

const logMsg = await logKanal.send({
content: message.content,
files: [foto]
})

logMsg.react("✅")
}

// ✅ TİK (ORİJİNAL MESAJA)
message.react("✅")

}catch(err){
console.log(err)
message.reply("❌ Hata oluştu")
}

})

client.login(process.env.TOKEN)
