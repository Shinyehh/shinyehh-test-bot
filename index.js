const Discord = require("discord.js")
require("dotenv").config()

const generateImage = require("./generateImage")

const client = new Discord.Client({
   /* intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
    */
   intents: [
    "Guilds",
    "GuildMessages",
    "MessageContent",
    "GuildMembers"
   ]
})

client.on("ready", () => {
    console.log(`WELCOME! Logged in as ${client.user.tag}`);
})

const welcomeChannelId = "1045917175459876914"

client.on("messageCreate", async (message) => {
    if (message.content == "hi"){
        message.reply("Hello World!");
    } else if (message.content == "image"){
        const member = message.author
        const img = await generateImage(member)
        const welcomeChannel = message.guild.channels.cache.get(welcomeChannelId)
        
        console.log([img])
        welcomeChannel.send({
            content: `<@${member.id}> Welcome to the server!`,
            files: [img]
        })
    }
})

client.on("guildMemberAdd", async (member) => {
    const img = await generateImage(member.user)
    member.guild.channels.cache.get(welcomeChannelId).send({
        content: `<@${member.id}> Welcome to the server!`,
        files: [img]
    })
})

client.login(process.env.TOKEN)