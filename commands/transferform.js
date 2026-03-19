const { 
Client, 
GatewayIntentBits, 
EmbedBuilder, 
SlashCommandBuilder 
} = require("discord.js")

const db = require("croxydb")

const client = new Client({
intents:[GatewayIntentBits.Guilds]
})

// ==================
// SLASH KOMUTLAR
// ==================

client.commands = [
new SlashCommandBuilder()
.setName("tutanak")
.setDescription("Tutanak oluşturur")
.addStringOption(o=>o.setName("tutanak_tutan").setRequired(true))
.addStringOption(o=>o.setName("roblox_ad").setRequired(true))
.addStringOption(o=>o.setName("sebep").setRequired(true))
.addStringOption(o=>o.setName("ceza").setRequired(true))
.addStringOption(o=>o.setName("tag").setRequired(true))
.addAttachmentOption(o=>o.setName("foto").setRequired(true)),

new SlashCommandBuilder()
.setName("dosya")
.setDescription("Kullanıcı dosyasını gösterir")
.addStringOption(o=>o.setName("roblox_ad").setRequired(true))
]

// ==================
// READY
// ==================

client.once("ready", async () => {

console.log("✅ Tutanak sistemi aktif")

await client.application.commands.set(client.commands)

})

// ==================
// KOMUTLAR
// ==================

client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return

// ==================
// TUTANAK
// ==================

if(interaction.commandName === "tutanak"){

const tutan = interaction.options.getString("tutanak_tutan")
const roblox = interaction.options.getString("roblox_ad")
const sebep = interaction.options.getString("sebep")
const ceza = interaction.options.getString("ceza")
const tag = interaction.options.getString("tag")
const foto = interaction.options.getAttachment("foto")

const tarih = new Date().toLocaleString("tr-TR")

// ✔️ ceza varsa tik
const tik = ceza && ceza !== "yok" ? "✅" : "❌"

// EMBED
const embed = new EmbedBuilder()
.setColor("DarkBlue")
.setTitle("📄 TUTANAK KAYDI")
.setDescription(`
👮 **Tutanak tutan:** ${tutan}
👤 **Tutanak tutulan:** ${roblox}

📌 **Sebep:** ${sebep}
⚖️ **Ceza:** ${ceza} ${tik}
🏷 **Tag:** ${tag}

🕒 **Tarih:** ${tarih}
`)
.setImage(foto.url)
.setFooter({text:"TFA Tutanak Sistemi"})

// DB KAYIT
let kayıt = db.get(`dosya_${roblox}`) || []

kayıt.push({
tutan,
sebep,
ceza,
tarih,
tag,
foto: foto.url
})

db.set(`dosya_${roblox}`, kayıt)

// GÖNDER
interaction.reply({embeds:[embed]})

}

// ==================
// DOSYA
// ==================

if(interaction.commandName === "dosya"){

const roblox = interaction.options.getString("roblox_ad")

const kayıt = db.get(`dosya_${roblox}`)

if(!kayıt || kayıt.length === 0){
return interaction.reply("❌ Bu kişiye ait kayıt yok")
}

// LİSTE OLUŞTUR
let text = ""

kayıt.forEach((x,i)=>{
text += `
${i+1}) 👮 ${x.tutan}
📌 ${x.sebep}
⚖️ ${x.ceza}
🕒 ${x.tarih}
\n`
})

const embed = new EmbedBuilder()
.setColor("Purple")
.setTitle(`📂 ${roblox} Dosyası`)
.setDescription(text.slice(0,4000))

interaction.reply({embeds:[embed]})

}

})

client.login(process.env.TOKEN)
