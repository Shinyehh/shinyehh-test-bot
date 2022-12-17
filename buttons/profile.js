const { getRobloxUsersFromMembers, getRankIdInGUF, getRankNameInGUF } = require('../lib/functions')
const { db } = require('../lib/firebase')
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
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

const totalPrestigeEmbed = async(interaction, members) => {
    const robloxData = await getRobloxUsersFromMembers([members])
    console.log(robloxData)
    let { robloxId, cachedUsername } = robloxData[0]
    let { id, name} = robloxData[0]

    robloxId = robloxId || id
    cachedUsername = cachedUsername || name
    console.log(robloxId + cachedUsername)

    if (!robloxData) {
        //await interaction.message.send("Could not retrieve roblox data")
        console.log("Could not find roblox data")
        return 
    }
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

    return new MessageEmbed()
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
}

const playerInfoEmbed = async(interaction, members) => {
    const robloxData = await getRobloxUsersFromMembers([members])
    if (!robloxData) {
        console.log("Cannot find roblox data")
        return
    }
    console.log(robloxData)
    let { robloxId, cachedUsername } = robloxData[0]
    let { id, name} = robloxData[0]

    robloxId = robloxId || id
    cachedUsername = cachedUsername || name
    //console.log(robloxId + cachedUsername)

    if (!robloxData || !robloxId || !cachedUsername) {
        //await interaction.message.send("Could not retrieve roblox data")
        console.log("Could not find roblox data")
        return 
    }
    const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
    const avatarUrl = avatarData[0].imageUrl

    let description = ``
    const plrNobloxInfo = await noblox.getPlayerInfo({userId: Number(robloxId)})
    description = `‣ Username: **${cachedUsername}**`
    if (plrNobloxInfo && plrNobloxInfo.displayName && plrNobloxInfo.displayName !== cachedUsername) {
        description += ` (Display Name: **${plrNobloxInfo.displayName}**\n)`
    } else {description += `\n`}

    let blurbFieldValue
    description += `‣ User Id: **${robloxId}**\n`
    if (plrNobloxInfo) {
        let oldUsernamesDescription = ``

        if (plrNobloxInfo.oldNames) {
            let count = 0
            let maxCount = 5
            for (const [i, name] of Object.entries(plrNobloxInfo.oldNames)) {
                const oldName = name
                if (count < maxCount) {
                    count += 1
                    if (oldUsernamesDescription == ``) {
                        oldUsernamesDescription = `‣ Prior Usernames: **${oldName}`
                    } else {
                        oldUsernamesDescription += `, ${oldName}`
                    }
                } else {
                    oldUsernamesDescription += `, & more...`
                    break
                }
            }
        }
        oldUsernamesDescription += `**`
        if (oldUsernamesDescription !== `**`) {
            description += `${oldUsernamesDescription}\n`
        }

        description += `‣ Age: **${plrNobloxInfo.age}\n**`
        description += `‣ Join Date: **${plrNobloxInfo.joinDate}\n**`

        description += `\n`
        description += `‣ Friend Count: **${plrNobloxInfo.friendCount}**\n`
        description += `‣ Follower Count: **${plrNobloxInfo.followerCount}\n**`
        description += `‣ Following Count: **${plrNobloxInfo.followingCount}\n\n**`

        blurbFieldValue = `*${plrNobloxInfo.blurb}*`
    }

    return new MessageEmbed()
        .setColor(`RED`)
        .setTitle(`${String(cachedUsername)}'s Roblox Account`)
        .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
        .setAuthor({
            name: "Prestige Infocenter",
            iconURL: "https://i.imgur.com/y4Gpo0V.png"
        })
        .setDescription(description)
        .setThumbnail(avatarUrl)
        .setImage("https://i.imgur.com/rxNB16Q.png")
        .addFields(
            {name: "Blurb", value: blurbFieldValue || '*N/A*', inline: false}
        )
        //.setFooter({iconURL: `https://i.imgur.com/y4Gpo0V.png`, text: `Missing Prestige? Please allow up to 72 hours`})
        .setTimestamp(Date.now())
}
module.exports = {
    name: "profile",

    run: async (bot, interaction, parameters) => {
        const category = parameters[0]
        const members = parameters[1]
        console.log(parameters)
        if (!interaction.guild) {
            return interaction.reply({
                content: "This command can only be used in a guild",
                ephemeral: true
            })
        }

        console.log("MEMBERS:")
        console.log(members)
        let results = ''
        if (category == "robloxinfo") {
            //results = new MessageEmbed().setTitle("TESTTT").setDescription(":OO").setColor("#FEE75C")
            results = await playerInfoEmbed(interaction, members)
            //await getTopTotalPrestige()
        } else if (category == "prestige") {
            results = await totalPrestigeEmbed(interaction, members)
        }

        //console.log("GOT RESULTS????")
        //console.log(results)
        //console.log("GOT RESULTS????")
        if (results) {
            interaction.message.edit({ embeds: [results] })
            interaction.deferReply();
            interaction.deleteReply();
        }
        /*  
        if (interaction.replied) {
           // console.log("REPLIED")
           
            return interaction.editReply({ embeds: [embedReply] })
        } else {
          //  console.log("NOT REPLIED?")
            return interaction.reply({ embeds: [embedReply] })
        }
        */
    }
}