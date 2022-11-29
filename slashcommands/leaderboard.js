const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const noblox = require('noblox.js')

const { getRobloxUserFromMember } = require('../lib/functions')
const { db } = require('../lib/firebase')

const run = async (client, interaction) => {
    console.log("Running leaderboard command")

     interaction.reply({//interaction.channel.send({
        embeds: [
            new MessageEmbed().setTitle("Prestige Leaderboards").setDescription("Select a leaderboard to view below!").setColor("BLUE")
        ],
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setCustomId("leaderboard-all").setStyle("PRIMARY").setLabel("All"),
                new MessageButton().setCustomId("leaderboard-sP").setStyle("PRIMARY").setLabel("Strength"),
                new MessageButton().setCustomId("leaderboard-kP").setStyle("PRIMARY").setLabel("Knowledge"),
                new MessageButton().setCustomId("leaderboard-hP").setStyle("PRIMARY").setLabel("Honor"),
                new MessageButton().setCustomId("leaderboard-lP").setStyle("PRIMARY").setLabel("Leadership")
            ])
        ]
    })
}

module.exports = {
    name: "leaderboard",
    description: "Show leaderboards",
    run
}