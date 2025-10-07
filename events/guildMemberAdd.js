** Kullanıcı Katıldığında Mesaj atar **

@bot.event
async def on_member_join(member):
    channel = discord.utils.get(member.guild.text_channels, name="hoşgeldin")
    if channel:
        await channel.send(f"{member.mention} sunucuya katıldı! 🎉")
