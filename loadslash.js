const Discord = require("discord.js")
require("dotenv").config()

const client = new Discord.Client({
    intents: [
        //"Guilds",
        // "GuildMessages",
        // "MessageContent",
        // "GuildMembers"
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.MESSAGE_CONTENT,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        //Discord.GatewayIntentBits.MessageContent,
        //Discord.GatewayIntentBits.GuildMembers,
    ]
})

let bot = {
    client,
}

//const guildId = "1046506345060376657" //i.e. Alexserver
const guildId = process.env.GUILDID//"1045539034811875408" //i.e. Shinyserver

client.slashcommands = new Discord.Collection()

client.loadSlashCommands = (bot, reload) => require("./handlers/slashcommands")(bot, reload)
client.loadSlashCommands(bot, false)

client.on("ready", async () => {
    const guild = client.guilds.cache.get(guildId)
    if (!guild)
        return console.error("Target guild not found")

    await guild.commands.set([...client.slashcommands.values()])
    //console.log(client.slashcommands)
    console.log(`Successfully loaded in ${client.slashcommands.size}`)
    process.exit(0)
})

client.login(process.env.TOKEN)