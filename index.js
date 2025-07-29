const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log("Bot başarıyla giriş yaptı!");
});

client.login("MTM5NDQyODEwMTM2NjI1NTY1Ng.GzEEMI._hveV9ZzqvKshoQIzL4Qp91HjQ5CcWRhcCFTvc"); // BURAYA token'ı yapıştır (tırnaksız değil, "token" şeklinde)
