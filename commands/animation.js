require("dotenv").config();

const {
Client,
GatewayIntentBits,
EmbedBuilder,
PermissionsBitField
} = require("discord.js");

const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.MessageContent
]});

const prefix = "tfa!";

let yetkiler = {};

if(fs.existsSync("./yetkiler.json")){
yetkiler = JSON.parse(fs.readFileSync("./yetkiler.json"));
}

function saveYetki(){
fs.writeFileSync("./yetkiler.json",JSON.stringify(yetkiler,null,2));
}

function hataEmbed(hata){

return new EmbedBuilder()
.setColor("Red")
.setTitle("❌ Bot Hatası")
.setDescription(`\`\`\`${hata}\`\`\``)
.setFooter({text:"TFA Bot Hata Sistemi"});
}


// BOT BAŞLADIĞINDA
client.once("ready",async ()=>{

console.log(`✅ ${client.user.tag} aktif`);

client.guilds.cache.forEach(guild=>{

console.log(`Sunucu kontrol: ${guild.name}`);

guild.channels.cache.forEach(channel=>{

console.log(`✔ Kanal: ${channel.name}`);

});

});

});


// MESAJ KOMUTLARI
client.on("messageCreate",async message=>{

if(message.author.bot) return;
if(!message.content.startsWith(prefix)) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();


// GÖREVLİ YETKİ SİSTEMİ
if(cmd === "görevli"){

if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
return message.reply("❌ Yetkin yok");

const sub = args[0];

if(sub === "ayarla"){

const komut = args[1];
const rol = message.mentions.roles.first();

if(!komut || !rol)
return message.channel.send({
embeds:[
new EmbedBuilder()
.setColor("Yellow")
.setDescription("⚠️ Kullanım: `tfa!görevli ayarla ban @rol`")
]});

yetkiler[komut] = rol.id;

saveYetki();

message.channel.send({
embeds:[
new EmbedBuilder()
.setColor("Green")
.setDescription(`✅ ${komut} komutu ${rol.name} rolüne verildi`)
]});

}


if(sub === "liste"){

let text = "";

for(const k in yetkiler){
text += `🔹 ${k} → <@&${yetkiler[k]}>\n`;
}

message.channel.send({
embeds:[
new EmbedBuilder()
.setColor("Blue")
.setTitle("🛡️ Yetki Listesi")
.setDescription(text || "Yetki ayarlanmamış")
]});

}

}


// BAN
if(cmd === "ban"){

try{

const user = message.mentions.members.first();

if(!user)
return message.reply("❌ Kullanıcı etiketle");

await user.ban();

message.channel.send({
embeds:[
new EmbedBuilder()
.setColor("Red")
.setDescription(`🔨 ${user.user.tag} banlandı`)
]});

}catch(err){

message.channel.send({embeds:[hataEmbed(err)]});

}

}


// KICK
if(cmd === "kick"){

try{

const user = message.mentions.members.first();

await user.kick();

message.channel.send({
embeds:[
new EmbedBuilder()
.setColor("Orange")
.setDescription(`👢 ${user.user.tag} kicklendi`)
]});

}catch(err){

message.channel.send({embeds:[hataEmbed(err)]});

}

}


// CLEAR
if(cmd === "clear"){

try{

const amount = args[0];

await message.channel.bulkDelete(amount);

message.channel.send({
embeds:[
new EmbedBuilder()
.setColor("Purple")
.setDescription(`🧹 ${amount} mesaj silindi`)
]});

}catch(err){

message.channel.send({embeds:[hataEmbed(err)]});

}

}

});


// GLOBAL HATA SİSTEMİ
process.on("unhandledRejection",error=>{

console.log("Bot hata:",error);

});


client.login(process.env.TOKEN);
