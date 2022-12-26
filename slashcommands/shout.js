const noblox = require('noblox.js')
const { group } = require('../config/config')
const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")

noblox.setCookie(process.env.COOKIE).then(function () { //Use COOKIE from our .env file.
    console.log("Logged in with cookie!")
}).catch(function (err) {
    console.log("Unable to log in with cookie!", err)
})

const run = async (client, interaction) => {
    let message = interaction.options.getString("message")

    if (!message) return interaction.reply("Invalid message")

    try {
        noblox.shout(group, message)//6870149, message)
        return interaction.reply(`Shouted: ${message}`)
    }
    catch (err) {
        if (err) {
            console.error(err)
            return interaction.reply(`Failed to send shout`)
        }
    }
}

module.exports = {
    name: "shout",
    description: "Change the group's shout",
    options: [
        {
            name: "message",
            description: `Message to shout`,
            type: 3, //STRING
            required: true
        },
    ],
    run
}