/*const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')
const { getRankNameInGUF, getRankIdInGUF, getRankNameFromID, getRobloxUsersFromMembers } = require('../lib/functions')
const { db } = require('../lib/firebase')
const rankData = require('../config/ranks.json')

const prestigeLimits = {
    dP: 10,
    sP: 7,
    hP: 7,
    lP: 5
}

const prestigeNames = {
    dP: 'Discipline',
    sP: 'Strength',
    hP: 'Honor',
    lP: 'Leadership'
}

function checkIfCanGiveLeadershipPrestige(interaction) {
    const member = interaction.member

    // console.log(member.id)
    if (member.id !== process.env.OWNER) {
        const guild = member.guild
        if (!guild) return false

        const allowedRole = guild.roles.cache.get(module.exports.highcomPerm)
        if (!allowedRole) return false
        const rolePosition = allowedRole.position
        const highestUserRolePosition = member.roles.highest.position

        if (highestUserRolePosition < rolePosition) return false
    }
    return true
}

const createDatabaseProfile = async (robloxId, prestige) => {
    ({ sP, dP, hP, lP } = prestige)

    db.collection('PrestigeDatabase').doc(robloxId).set({
        'sP': sP || 0,
        'dP': dP || 0,
        'hP': hP || 0,
        'lP': lP || 0,
    });
}

const givePrestige = async (robloxId, robloxName, prestige) => {

    ({ sP, dP, hP, lP } = prestige)
    const basePrestige = {
        'sP': sP || 0,
        'dP': dP || 0,
        'hP': hP || 0,
        'lP': lP || 0
    }

    let prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)
    let doc = await prestigeRef.get()

    if (!doc.exists) {
        console.log(`Creating database profile for ${robloxName}`);
        createDatabaseProfile(robloxId, prestige)

        return basePrestige

    } else {
        const data = doc.data()

        if (Object.keys(data).length === 0) {
            db.collection('PrestigeDatabase').doc(robloxId).set(basePrestige);

            return basePrestige
        } else {
            const currentsP = data.sP || 0
            const currentdP = data.dP || 0
            const currenthP = data.hP || 0
            const currentlP = data.lP || 0

            db.collection('PrestigeDatabase').doc(robloxId).set({
                'sP': currentsP + sP,
                'dP': currentdP + dP,
                'hP': currenthP + hP,
                'lP': currentlP + lP,
            });

            return {
                'sP': currentsP + sP,
                'dP': currentdP + dP,
                'hP': currenthP + hP,
                'lP': currentlP + lP
            }
        }
    }
}

const sendMiscErrorEmbed = async (interaction, msg) => {
    await interaction.channel.send({
        embeds: [
            new MessageEmbed()
                .setColor("RED")
                .setAuthor({
                    name: "Prestige Infocenter",
                    iconURL: "https://i.imgur.com/y4Gpo0V.png"
                })
                .setTitle(`Player Error`)
                .setDescription(msg)
                .setImage('https://i.imgur.com/910F0td.png')
                .setTimestamp(Date.now())
        ]
    })
}

const sendCouldNotFindEmbed = async (player, interaction, message) => {
    let requestedName = player.requestedUsername
    let found = player.found

    let discordId = player.discordId

    if ((requestedName && found == "Not Found") || (discordId)) {
        let msg = ""
        if (requestedName) {
            msg = `Could not find roblox data for ${requestedName}`
        } else {
            msg = `Could not find roblox data for discord user <@!${discordId}>`
        }
        await interaction.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor("RED")
                    .setAuthor({
                        name: "Prestige Infocenter",
                        iconURL: "https://i.imgur.com/y4Gpo0V.png"
                    })
                    .setTitle(`Player Error`)
                    .setDescription(msg)
                    .setImage('https://i.imgur.com/910F0td.png')
                    .setTimestamp(Date.now())
            ]
        })
    }
}

const sendSuccessEmbed = async (robloxId, robloxName, rankName, prestige, newPrestige, nextRankInfo, interaction, embedsSent) => {
    let totalNewPrestige = (newPrestige.dP || 0) + (newPrestige.sP || 0) + (newPrestige.hP || 0) + (newPrestige.lP || 0)
    const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
    const avatarUrl = avatarData[0].imageUrl

    let description = ``
    // Add given prestige to description
    given = Object.keys(prestige).map((type) => {
        if (prestige[type] !== 0) {
            let plusSign = ""
            if (prestige[type] > 0){plusSign = "+"}
            description += `${newPrestige[type] - prestige[type]}${type} -> ${newPrestige[type]}${type} **(${plusSign}${prestige[type]}${type})** \n`
        }
    })

    // Add next rank information
    //description += `\nNext Rank: **Soldier (10sP)**\n`
    let secondaryPrestigeDescription = ""
 
    if (nextRankInfo.TotalSecondary > 0 && nextRankInfo.SecondaryTypes) {
        secondaryPrestigeDescription = ` (incl. ${nextRankInfo.TotalSecondary} ${nextRankInfo.SecondaryTypes})`
    }
    description += `\nNext Rank: **${nextRankInfo.RankName} : ${nextRankInfo.Total} Total Prestige${secondaryPrestigeDescription}**\n`
    const embedReply = new MessageEmbed()
        .setColor("BLUE")
        .setAuthor({
            name: "Prestige Infocenter",
            iconURL: "https://i.imgur.com/y4Gpo0V.png"
        })

        .setTitle(`${rankName} ${robloxName}`)
        .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
        .setThumbnail(avatarUrl)

        // Given prestige
        .setDescription(`${description}`)

        // Current prestige
        .addFields(
            { name: 'sP', value: `${newPrestige.sP}`, inline: true },
            { name: 'dP', value: `${newPrestige.dP}`, inline: true },
            { name: 'hP', value: `${newPrestige.hP}`, inline: true },
            { name: 'lP', value: `${newPrestige.lP}`, inline: true },
            {name: `Total:`, value: `${totalNewPrestige} Prestige`, inline: false}
        )

        .setImage('https://i.imgur.com/910F0td.png')

        .setTimestamp(Date.now())

    embedsSent.push(embedReply)

    await interaction.channel.send({ embeds: [embedReply] })
}

const sendFinalSuccessEmbed = async (interaction) => {

    const authorRobloxData = await getRobloxUsersFromMembers([interaction.user.id])

    if (authorRobloxData && authorRobloxData[0]) {
        const robloxId = authorRobloxData[0].robloxId
        const robloxName = authorRobloxData[0].cachedUsername

        if (robloxId && robloxName) {
            const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
            const avatarUrl = avatarData[0].imageUrl

            const rankName = await getRankNameInGUF(robloxId)

            await interaction.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor("GREEN")
                        .setAuthor({
                            name: "Prestige Infocenter",
                            iconURL: "https://i.imgur.com/y4Gpo0V.png"
                        })

                        .setTitle(`${rankName} ${robloxName}`)
                        .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
                        .setThumbnail(avatarUrl)

                        // Given prestige
                        .setDescription(`Successfully awarded prestige (see above)`)

                        .setImage('https://i.imgur.com/910F0td.png')

                        .setTimestamp(Date.now())
                ]
            })
        }
    }
}

const getNextRankInfo = async (rankId, rankName) => {
    const currentRankId = Number(rankId)
    let nextRankId = Number(rankId)
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
        console.log(`NEXT RANK ID: ${nextRankId}`)

        const secondaryPrestige = nextRankInfo.secondaryPrestige
        let secondaryTypes

        for (const type of secondaryPrestige) {
            if (secondaryTypes == null) {
                secondaryTypes = type
            } else {
                secondaryTypes = secondaryTypes + "/" + type
            }
            
        }
        console.log(secondaryTypes)
        return {
            ["RankName"] : nextRankInfo.name,
            ["Total"] : nextRankInfo.total,
            ["TotalSecondary"] : nextRankInfo.secondaryPrestigeValue,
            ["SecondaryTypes"] : secondaryTypes
        }
    }
}

const tryPromote = async (robloxId, prestige) => {
    const currentRankId = await getRankIdInGUF(robloxId)
    const currentRankName = await getRankNameInGUF(robloxId)

    let highestRankId = currentRankId
    let highestRankName = currentRankName

    let currentTotalPrestige = (prestige.dP || 0) + (prestige.sP || 0) + (prestige.hP || 0) + (prestige.lP || 0)
    //console.log(`CURRENT AMOUNT OF PRESTIGE: ${currentTotalPrestige}`)

    if (rankData[String(currentRankId)] == null) {
        console.log(`Cannot toggle rank for this user.`)
        return {["RankId"] : highestRankId, ["RankName"]: highestRankName}
    }
    let previousId = 1
    let previousName = rankData["1"].name
    for (const [name, rank] of Object.entries(rankData)) {
        const id = Number(name)//rank.id
        // Check total prestige requirement met
        console.log(`TOTAL PRESTIGE NEEDED FOR RANK ${name}: ${rank.total}; CURRENT TOTAL PRESTIGE: ${currentTotalPrestige}`)
        if (currentTotalPrestige < rank.total) { //if (prestige[rank.mainPrestige] < rank.mainPrestigeValue) {
            // Main prestige requirement NOT met
            if (id <= highestRankId && previousId > 0) {
                await noblox.setRank(process.env.GROUP, robloxId, previousId)//6870149, robloxId, highestRankId)
                console.log(`USER WAS DEMOTED TO RANK ${previousId} DUE TO NOT HAVING THE APPROPRIATE TOTAL NUMBER OF PRESTIGE`)
                highestRankId = previousId
                highestRankName = previousName
            }
            break
        }

        let secondaryTotal = 0
        let secondaryPrestige = rank.secondaryPrestige

        for (const type of secondaryPrestige) {
            secondaryTotal += prestige[type]
        }
        console.log(`SECONDARY PRESTIGE TOTAL: ${secondaryTotal}`)
        if (secondaryTotal < rank.secondaryPrestigeValue) {
           // Secondary prestige NOT met
            if (id <= highestRankId && previousId > 0) {
                await noblox.setRank(process.env.GROUP, robloxId, id)//6870149, robloxId, highestRankId)
                console.log(`USER WAS DEMOTED TO RANK ${previousId} DUE TO NOT HAVING THE APPROPRIATE SECONDARY PRESTIGE TOTAL`)
                highestRankId = previousId
                highestRankName = previousName
            }
            break
        }

        console.log(`id: ${id}; highestRankId: ${highestRankId}`)
        if (id > highestRankId) { console.log("YES")
            highestRankId = id
            highestRankName = rank.name
        }

        console.log(`highest rank ID: ${highestRankId}; currentRankId: ${currentRankId}`)
        previousId = id
        previousName = rank.name
    }
 
    if (highestRankId > currentRankId) {
        console.log("PROMOTING")
        await noblox.setRank(process.env.GROUP, robloxId, highestRankId)//6870149, robloxId, highestRankId)
        console.log("PROMOTED!!!")
        //return {["RankId"] : highestRankId, ["RankName"]: highestRankName}//highestRankName
    }
    console.log("HIGHEST RANK NAME: " + highestRankName)
    return {["RankId"] : highestRankId, ["RankName"]: highestRankName} //highestRankName
}
*/

const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const rankData = require('../config/ranks.json')

const getRankFields = async(interaction) => {

    let rankFields = []

    for (const [name, rank] of Object.entries(rankData)) {
        const id = Number(name)
        const totalPrestige = rank.total
        const totalSecondaryPrestige = rank.secondaryPrestigeValue
       // const roleid = rank.roleid

        const secondaryPrestige = rank.secondaryPrestige
        let secondaryTypes
        for (const type of secondaryPrestige) {
            if (secondaryTypes == null) {
                secondaryTypes = type
            } else {
                secondaryTypes = secondaryTypes + "/" + type
            }
        }

        const fieldName = rank.name
        let fieldVal

        fieldVal = `‣ID: **${id}** \n`
        
        //if (roleid) {
        //    fieldVal += `Role: <@&${roleid}>\n`
        //}

        fieldVal += `‣Total Prestige: **${totalPrestige}**\n`
        
        if (secondaryTypes) {
            fieldVal += `‣Secondary Prestige: **${totalSecondaryPrestige} ${secondaryTypes}**\n`
        }
        fieldVal += `**____________**`
        rankFields.push({name: fieldName, value: fieldVal, inline: true})
    }
    console.log(rankFields)
    return rankFields
}

const run = async (client, interaction) => {
    try {
        const rankFields = await getRankFields(interaction)
        if (!interaction.replied && rankFields) {

            let description = `Below lists each of the ranks one may earn through earning different types of prestige by attending different events.\n\n`
            description += `**Primary Prestige:** *The necessary combined total prestige of any type*\n`
            description += `**Secondary Prestige:** *The necessary combination of specific types of prestige (typically sP & hP)*\n\n`
            description += `**Example:** [4] Guard requires ${rankData["4"].total} Total Prestige, although at least ${rankData["4"].secondaryPrestigeValue} must be a combination of sP & hP.\n\n`

            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                    .setColor(`#FEE75C`)
                    .setTitle(`Earnable Ranks`)
                    //.setURL(path_to_prestige_document_to_be_written_and_published)
                    .setAuthor({
                        name: "Prestige Infocenter",
                        iconURL: "https://i.imgur.com/y4Gpo0V.png"
                    })
                    .setDescription(description)
                    .addFields(rankFields)
                    .setThumbnail(`https://i.imgur.com/y4Gpo0V.png`)
                    .setTimestamp()
                    .setFooter({iconURL: `https://i.imgur.com/y4Gpo0V.png`, text: `Questions? Reach out to a member of the highcommand`})
                    .setTimestamp(Date.now())
                ],
            })
        }
    }
    catch(err){
        if (err){
            console.error(err)
            if (!interaction.replied) {
                return interaction.reply(`Failed to retrieve rank information!`)
            }
        }
    }
}

module.exports = {
    name: "ranks",
    description: "View detailed prestige requirements for each rank",
    //perm: "KICK_MEMBERS",

    //highcomPerm: process.env.ADMIRAL_ROLE,
    //officerPerm: process.env.OFFICER_ROLE,

    //rolePermission: process.env.OFFICER_ROLE,

    options: [],
    run
}