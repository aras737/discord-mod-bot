const { 
Client,
GatewayIntentBits,
PermissionsBitField,
EmbedBuilder
} = require("discord.js");

const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]});

const prefix = "tfa!";

let yetkiler = {};
let warns = {};

if(fs.existsSync("./yetkiler.json")){
yetkiler = JSON.parse(fs.readFileSync("./yetkiler.json"));
}

if(fs.existsSync("./warns.json")){
warns = JSON.parse(fs.readFileSync("./warns.json"));
}

function saveYetki(){
fs.writeFileSync("./yetkiler.json", JSON.stringify(yetkiler,null,2));
}

function saveWarn(){
fs.writeFileSync("./warns.json", JSON.stringify(warns,null,2));
}

client.once("ready",()=>{
console.log(`${client.user.tag} aktif`);
});

client.on("messageCreate", async message=>{

if(message.author.bot) return;
if(!message.content.startsWith(prefix)) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

function yetkiKontrol(komut){

if(!yetkiler[komut]) return true;

return message.member.roles.cache.has(yetkiler[komut]);

}


// GÖREVLİ SİSTEMİ
if(cmd === "görevli"){

if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
return message.reply("❌ Yetkin yok");

const sub = args[0];

if(sub === "ayarla"){

const komut = args[1];
const rol = message.mentions.roles.first();

if(!komut || !rol)
return message.reply("Kullanım: tfa!görevli ayarla ban @rol");

yetkiler[komut] = rol.id;

saveYetki();

message.channel.send(`✅ ${komut} komutu artık ${rol.name} rolüne verildi`);

}

if(sub === "liste"){

let text = "";

for(const k in yetkiler){

text += `\n${k} → <@&${yetkiler[k]}>`;

}

const embed = new EmbedBuilder()
.setTitle("🛡️ Yetki Listesi")
.setDescription(text || "Yetki yok");

message.channel.send({embeds:[embed]});

}

}


// BAN
if(cmd === "ban"){

if(!yetkiKontrol("ban"))
return message.reply("❌ Yetkin yok");

const user = message.mentions.members.first();
if(!user) return message.reply("Kullanıcı etiketle");

const reason = args.slice(1).join(" ") || "Sebep yok";

await user.ban({reason});

message.channel.send(`🔨 ${user.user.tag} banlandı`);

}


// KICK
if(cmd === "kick"){

if(!yetkiKontrol("kick"))
return message.reply("❌ Yetkin yok");

const user = message.mentions.members.first();

await user.kick();

message.channel.send(`👢 ${user.user.tag} kicklendi`);

}


// MUTE
if(cmd === "mute"){

if(!yetkiKontrol("mute"))
return message.reply("❌ Yetkin yok");

const user = message.mentions.members.first();

await user.timeout(10*60*1000);

message.channel.send(`🔇 ${user.user.tag} mute yedi`);

}


// UNMUTE
if(cmd === "unmute"){

if(!yetkiKontrol("unmute"))
return message.reply("❌ Yetkin yok");

const user = message.mentions.members.first();

await user.timeout(null);

message.channel.send(`🔊 ${user.user.tag} unmute`);

}


// WARN
if(cmd === "warn"){

if(!yetkiKontrol("warn"))
return message.reply("❌ Yetkin yok");

const user = message.mentions.users.first();
const reason = args.slice(1).join(" ") || "Sebep yok";

if(!warns[user.id]) warns[user.id] = [];

warns[user.id].push(reason);

saveWarn();

message.channel.send(`⚠️ ${user.tag} warn aldı`);

}


// WARNLAR
if(cmd === "warnlar"){

const user = message.mentions.users.first();

const data = warns[user.id] || [];

const embed = new EmbedBuilder()
.setTitle(`${user.tag} Warnları`)
.setDescription(data.join("\n") || "Warn yok");

message.channel.send({embeds:[embed]});

}


// CLEAR
if(cmd === "clear"){

if(!yetkiKontrol("clear"))
return message.reply("❌ Yetkin yok");

const amount = args[0];

await message.channel.bulkDelete(amount);

message.channel.send(`🧹 ${amount} mesaj silindi`);

}


// KİLİT
if(cmd === "kilit"){

if(!yetkiKontrol("kilit"))
return message.reply("❌ Yetkin yok");

await message.channel.permissionOverwrites.edit(
message.guild.roles.everyone,
{SendMessages:false}
);

message.channel.send("🔒 Kanal kilitlendi");

}


// AÇ
if(cmd === "aç"){

if(!yetkiKontrol("aç"))
return message.reply("❌ Yetkin yok");

await message.channel.permissionOverwrites.edit(
message.guild.roles.everyone,
{SendMessages:true}
);

message.channel.send("🔓 Kanal açıldı");

}


// AVATAR
if(cmd === "avatar"){

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle(user.tag)
.setImage(user.displayAvatarURL({size:1024}));

message.channel.send({embeds:[embed]});

}


// SUNUCU
if(cmd === "sunucu"){

const embed = new EmbedBuilder()
.setTitle(message.guild.name)
.addFields(
{name:"Üye",value:String(message.guild.memberCount)},
{name:"Kurucu",value:`<@${message.guild.ownerId}>`}
);

message.channel.send({embeds:[embed]});

}


// KULLANICI
if(cmd === "kullanıcı"){

const user = message.mentions.members.first() || message.member;

const embed = new EmbedBuilder()
.setTitle(user.user.tag)
.addFields(
{name:"ID",value:user.id},
{name:"Katılma",value:String(user.joinedAt)}
);

message.channel.send({embeds:[embed]});

}

});

client.login("TOKEN");
