const { getRobloxUsersFromMembers, getRankIdInGUF, getRankNameInGUF } = require('../lib/functions')
const { db } = require('../lib/firebase')
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')
const rankData = require('../config/ranks.json')



const run = async (client, interaction) => {
    await interaction.deferReply("Searching profile...")
    let members = interaction.options.getString("user")
    if (!members) {
        members = interaction.user.id
    } else {
        let membersText = String(members.replace(/[,@<>!]/g, ""))
        membersText = membersText.replace(/\s\s+/g, ' ')
        let membersArray = membersText.split(" ")
        members = membersArray[0]
    }
    return await interaction.editReply({//interaction.channel.send({
        embeds: [
            new MessageEmbed().setTitle("Infocenter Profile").setDescription("Select the profile information you want to view").setColor("#FEE75C")
        ],
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setCustomId(`profile-prestige-${members}`).setStyle("PRIMARY").setLabel("Prestige"),
                new MessageButton().setCustomId(`profile-info-${members}`).setStyle("PRIMARY").setLabel("Group Info"),
            ])
        ]
    })
}



module.exports = {
    name: "profile",
    description: "Get your GUF profile.",

    options: [
        {
            name: "user",
            description: "The user's profile you are searching (roblox name or discord @)",
            type: 3, //STRING
            required: false
        },
    ],

    run
}