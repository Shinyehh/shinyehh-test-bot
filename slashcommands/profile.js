const { getRobloxUsersFromMembers, getRankIdInGUF, getRankNameInGUF } = require('../lib/functions')
const { db } = require('../lib/firebase')
const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')
const rankData = require('../config/ranks.json')

const getNextRankInfo = async(rankId) => {
    const currentRankId = Number(rankId)
    let nextRankId = currentRankId
    let nextRankInfo
    
    for (const [name, rank] of Object.entries(rankData)) {
        const id = Number(name)
        if (id > nextRankId) {
            nextRankId = id
            nextRankInfo = rank
            break
        }
    }

    if (nextRankId > currentRankId && nextRankInfo) {

        let secondaryPrestige = nextRankInfo.secondaryPrestige
        let secondaryTypes
        
        for (const type of secondaryPrestige) {
            if (secondaryTypes == null) {
                secondaryTypes = type
            } else {
                secondaryTypes = secondaryTypes + "/" + type
            }
        }

        return {
            ["RankName"] : nextRankInfo.name,
            ["Total"] : Number(nextRankInfo.total),
            ["TotalSecondary"] : Number(nextRankInfo.secondaryPrestigeValue),
            ["SecondaryTypesTable"] : nextRankInfo.secondaryPrestige,
            ["SecondaryTypesText"] : secondaryTypes
        }
    }
    return
}

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
    const robloxData = await getRobloxUsersFromMembers([members])
    console.log(robloxData)
    let { robloxId, cachedUsername } = robloxData[0]
    let { id, name} = robloxData[0]

    robloxId = robloxId || id
    cachedUsername = cachedUsername || name
    console.log(robloxId + cachedUsername)
    //const robloxId = 74851095 
    //const cachedUsername = "hisokachan"
    //console.log(robloxData)

    if (!robloxData) return await interaction.followUp("Could not retrieve roblox data")
    const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
    const avatarUrl = avatarData[0].imageUrl
    
    let prestigeRef = db.collection('PrestigeDatabase').doc(String(robloxId))
    const doc = await prestigeRef.get();

    let prestige = { sP: 0, dP: 0, lP: 0, hP: 0 }
    if (doc.exists) {
        prestige = doc.data()
    }

    const currentRankId = await getRankIdInGUF(robloxId)
    const currentRankName = await getRankNameInGUF(robloxId)
    const currentTotalPrestige = (prestige.dP || 0) + (prestige.sP || 0) + (prestige.hP || 0) + (prestige.lP || 0)
    const nextRankInfo = await getNextRankInfo(currentRankId)

    let description = `Rank: **${currentRankName}**\n`
    description += `Total Prestige: **${currentTotalPrestige}**\n\n`

    // Add next rank information
    let nextRankDescription
    if (nextRankInfo) {
        let nextRankName = nextRankInfo.RankName
        let nextRankTotalPrestige = nextRankInfo.Total
        let nextRankTotalSecondaryPrestige = nextRankInfo.TotalSecondary
        let secondaryTypesText = nextRankInfo.SecondaryTypesText
        let secondaryTypesTable = nextRankInfo.SecondaryTypesTable

        let currentTotalSecondaryPrestige = 0
        if (secondaryTypesTable && secondaryTypesText) {
            for (const type of secondaryTypesTable) {
                currentTotalSecondaryPrestige += prestige[type]
            }
        }

        if (nextRankInfo && nextRankTotalPrestige && nextRankName) {
            
            let totalPrestigeToNextRank = nextRankTotalPrestige - currentTotalPrestige
            if (totalPrestigeToNextRank < 0) {
                totalPrestigeToNextRank = 0
            }

            let totalSecondaryPrestigeToNextRank =  nextRankTotalSecondaryPrestige - currentTotalSecondaryPrestige
            if (totalSecondaryPrestigeToNextRank < 0) {
                totalSecondaryPrestigeToNextRank = 0
            }
            
            nextRankDescription = `**${totalPrestigeToNextRank}** Total Prestige`
            if (secondaryTypesTable && secondaryTypesText && currentTotalSecondaryPrestige) {
                nextRankDescription += ` (incl. **${totalSecondaryPrestigeToNextRank}** ${secondaryTypesText})`
            }
            nextRankDescription += ` remaining for **${nextRankName} (${nextRankTotalPrestige} Total`
           
            if (nextRankTotalSecondaryPrestige && secondaryTypesText) {
                nextRankDescription += ` incl. ${nextRankTotalSecondaryPrestige} ${secondaryTypesText})**`
            } else {
                nextRankDescription += `)**`
            }
            
        }
        if (nextRankDescription) {
            description += nextRankDescription
        }
    }

    return await interaction.editReply({//interaction.channel.send({
        embeds: [
            new MessageEmbed()
                .setColor(`#FEE75C`)
                .setTitle(`${String(cachedUsername)}'s Prestige Profile`)
                .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
                .setAuthor({
                    name: "Prestige Infocenter",
                    iconURL: "https://i.imgur.com/y4Gpo0V.png"
                })
                .setDescription(description)
                .addFields(
                    { name: 'dP', value: String(prestige.dP), inline: true },
                    { name: 'sP', value: String(prestige.sP), inline: true },
                    { name: 'hP', value: String(prestige.hP), inline: true },
                    { name: 'lP', value: String(prestige.lP), inline: true },
                )
                .setThumbnail(avatarUrl)
                .setFooter({iconURL: `https://i.imgur.com/y4Gpo0V.png`, text: `Missing Prestige? Please allow up to 72 hours`})
                .setTimestamp(Date.now())
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