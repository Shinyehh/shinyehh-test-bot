const Discord = require("discord.js")

const generateImage = require("../../generateImage")
const welcomeChannelId = "1045917175459876914"

module.exports = {
    name: "image", //name of file
    category: "info",
    permissions: [],
    devOnly: false,
    run: async ({client, message, args}) => {
        const member = message.author
        const img = await generateImage(member)
        const welcomeChannel = message.guild.channels.cache.get(welcomeChannelId)
        
        console.log([img])
        welcomeChannel.send({
            content: `<@${member.id}> Welcome to the server!`,
            files: [img]
        })
    }
}