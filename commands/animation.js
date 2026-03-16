require("dotenv").config()

const {
Client,
GatewayIntentBits,
EmbedBuilder,
PermissionsBitField
} = require("discord.js")

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.MessageContent
]})

const prefix="tfa!"

const commands=[
"ban",
"kick",
"mute",
"unmute",
"clear",
"kilit",
"aç",
"slowmode",
"görevli",
"yardım"
]

function embed(color,text){
return new EmbedBuilder().setColor(color).setDescription(text)
}

client.once("ready",()=>{
console.log("✅ Bot aktif:",client.user.tag)
})

client.on("messageCreate",async message=>{

if(message.author.bot) return

const content=message.content.toLowerCase()

if(!content.startsWith(prefix)) return

const args=content.slice(prefix.length).split(" ")
const cmd=args.shift()

const logChannel=message.guild.channels.cache.get(process.env.LOG_CHANNEL)


// YARDIM

if(cmd==="yardım"){

const e=new EmbedBuilder()

.setColor("Blue")
.setTitle("🤖 TFA Moderasyon Bot")

.addFields(

{name:"🛡 Moderasyon",
value:"tfa!ban\n tfa!kick\n tfa!mute\n tfa!unmute\n tfa!clear"},

{name:"⚙ Yönetim",
value:"tfa!kilit\n tfa!aç\n tfa!slowmode"},

{name:"👮 Yetki",
value:"tfa!görevli ayarla\n tfa!görevli liste"}

)

return message.channel.send({embeds:[e]})

}


// BAN

if(cmd==="ban"){

if(!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return message.reply("❌ Yetkin yok")

const user=message.mentions.members.first()

if(!user) return message.reply("❌ Kullanıcı etiketle")

await user.ban()

message.channel.send({
embeds:[embed("Red",`🔨 ${user.user.tag} banlandı`)]
})

if(logChannel)
logChannel.send({
embeds:[embed("Red",`📊 BAN LOG\n👤 ${user.user.tag}\n👮 ${message.author.tag}`)]
})

}


// KICK

if(cmd==="kick"){

const user=message.mentions.members.first()

await user.kick()

message.channel.send({
embeds:[embed("Orange",`👢 ${user.user.tag} kicklendi`)]
})

if(logChannel)
logChannel.send({
embeds:[embed("Orange",`📊 KICK LOG\n👤 ${user.user.tag}\n👮 ${message.author.tag}`)]
})

}


// MUTE

if(cmd==="mute"){

const user=message.mentions.members.first()

await user.timeout(10*60*1000)

message.channel.send({
embeds:[embed("Yellow",`🔇 ${user.user.tag} mute aldı`)]
})

if(logChannel)
logChannel.send({
embeds:[embed("Yellow",`📊 MUTE LOG\n👤 ${user.user.tag}`)]
})

}


// UNMUTE

if(cmd==="unmute"){

const user=message.mentions.members.first()

await user.timeout(null)

message.channel.send({
embeds:[embed("Green",`🔊 ${user.user.tag} unmute`)]
})

}


// CLEAR

if(cmd==="clear"){

const amount=args[0]

await message.channel.bulkDelete(amount)

message.channel.send({
embeds:[embed("Purple",`🧹 ${amount} mesaj silindi`)]
})

if(logChannel)
logChannel.send({
embeds:[embed("Purple",`📊 CLEAR LOG\n${amount} mesaj silindi`)]
})

}


// KİLİT

if(cmd==="kilit"){

await message.channel.permissionOverwrites.edit(
message.guild.roles.everyone,
{SendMessages:false}
)

message.channel.send({
embeds:[embed("Grey","🔒 Kanal kilitlendi")]
})

}


// AÇ

if(cmd==="aç"){

await message.channel.permissionOverwrites.edit(
message.guild.roles.everyone,
{SendMessages:true}
)

message.channel.send({
embeds:[embed("Green","🔓 Kanal açıldı")]
})

}


// SLOWMODE

if(cmd==="slowmode"){

const time=args[0]

await message.channel.setRateLimitPerUser(time)

message.channel.send({
embeds:[embed("Blue",`🐢 Slowmode ${time} saniye`)]
})

}


// HATALI KOMUT

if(!commands.includes(cmd)){

return message.channel.send({
embeds:[
embed("Yellow",`❓ Komut bulunamadı`)
]
})

}

})

client.login(process.env.TOKEN)
