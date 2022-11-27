const Discord = require("discord.js")
const { Client, GatewayIntentBits } = require('discord.js')

require("dotenv").config()

const generateImage = require("./generateImage")

const client = new Discord.Client({
   intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.MESSAGE_CONTENT,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    ]
    /*
   intents: [
    "Guilds",
    "GuildMessages",
    "MessageContent",
    "GuildMembers"
   ] */
})

let bot = {
    client,
    prefix: "!",
    owners: ["110634487234203648"]
}

/*
//FIREBASE STUFF:
const firebase = require('firebase/app');
const fieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json')
const owner = process.env.OWNER

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let db = admin.firestore();

client.on("guildCreate", async gData => {
     console.log("GUILD CREATE")

    console.log(gData.id)
    console.log(gData.name)
    console.log(gData.memberCount)
     db.collection('guilds').doc(gData.id).set({
        'guildID' : gData.id,
        'guildName' : gData.name,
        'guildMemberCount' : gData.memberCount,
        'prefix' : 'p!',
     });
});

*/

//

client.commands = new Discord.Collection()
client.events = new Discord.Collection()
client.slashcommands = new Discord.Collection()
client.buttons = new Discord.Collection()

client.loadEvents = (bot, reload) => require("./handlers/events")(bot, reload)
client.loadCommands = (bot, reload) => require("./handlers/commands")(bot, reload)
client.loadSlashCommands = (bot, reload) => require("./handlers/slashcommands")(bot, reload)
client.loadButtons = (bot, reload) => require("./handlers/buttons")(bot, reload)

client.loadEvents(bot, false)
client.loadCommands(bot, false)
client.loadSlashCommands(bot, false)
client.loadButtons(bot, false)

module.exports = bot

/*
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
*/
/*
client.on("interactionCreate", (interaction) => {
    if (!interaction.isCommand()) return
    if (!interaction.inGuild()) return interaction.reply("This command can only be used in a server")
    
    //console.log(client.slashcommands)
    const slashcmd = client.slashcommands.get(interaction.commandName)

  //  console.log(slashcmd)
    if (!slashcmd) return interaction.reply("Invalid slash command")

    if (slashcmd.perms && !interaction.member.permission.has(slashcmd.perm))
        return interaction.reply("You do not have permission for this command")

    slashcmd.run(client, interaction)
})
*/
client.login(process.env.TOKEN)