const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')
const { getRankNameInGUF, getRankIdInGUF, getRankNameFromID, getRobloxUsersFromMembers } = require('../lib/functions')
const { db } = require('../lib/firebase')
const rankData = require('../config/ranks.json')
const auditLogChannel = "1053552179652341821"

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

const sendSuccessEmbed = async (robloxId, robloxName, currentRankName, newRankName, changeRankAction, prestige, newPrestige, nextRankInfo, interaction, reason, embedsSent) => {
    let totalNewPrestige = (newPrestige.dP || 0) + (newPrestige.sP || 0) + (newPrestige.hP || 0) + (newPrestige.lP || 0)
    const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
    const avatarUrl = avatarData[0].imageUrl

    let description = ``
    // Add given prestige to description
    given = Object.keys(prestige).map((type) => {
        if (prestige[type] !== 0) {
            let plusSign = ""
            if (prestige[type] > 0){plusSign = "+"}
            description += `${newPrestige[type] - prestige[type]} ${type} -> ${newPrestige[type]} ${type} **(${plusSign}${prestige[type]} ${type})** \n`
        }
    })
    description += `Reason: ${reason}\n`
    // Add next rank information
    //description += `\nNext Rank: **Soldier (10sP)**\n`

    let color = "BLUE"
    if (newRankName && currentRankName && changeRankAction) {

        if (changeRankAction == "Promoted") {
            color = "#FF69B4"
            description += `\nRank: Promoted from **${currentRankName}** to **${newRankName}**!`
        } else if (changeRankAction == "Demoted") {
            color = "#ff5a00"
            description += `\nRank: Demoted from **${currentRankName}** to **${newRankName}**!`
        }
    } else if (currentRankName) {
        description += `\nRank: **${currentRankName}**`
    }

    let secondaryPrestigeDescription = ""

    if (nextRankInfo && nextRankInfo.TotalSecondary && nextRankInfo.TotalSecondary > 0 && nextRankInfo.SecondaryTypes) {
        secondaryPrestigeDescription = ` incl. ${nextRankInfo.TotalSecondary} ${nextRankInfo.SecondaryTypes}`
    }

    if (nextRankInfo && nextRankInfo.RankName && nextRankInfo.Total) {
        description += `\nNext Rank: **${nextRankInfo.RankName} (${nextRankInfo.Total} Total${secondaryPrestigeDescription})**\n`
    }
    
    const embedReply = new MessageEmbed()
        .setColor(color)
        //.setTitle(`${currentRankName} ${robloxName}`)
        .setTitle(`${robloxName}`)
        .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
        .setAuthor({
            name: "Prestige Infocenter",
            iconURL: "https://i.imgur.com/y4Gpo0V.png"
        })
        .setImage('https://i.imgur.com/910F0td.png')
        // Given prestige
        .setDescription(`${description}`)
        // Current prestige
        //.addFields(
        //    { name: 'dP', value: `${newPrestige.dP}`, inline: true },
        //    { name: 'sP', value: `${newPrestige.sP}`, inline: true },
        //    { name: 'hP', value: `${newPrestige.hP}`, inline: true },
        //    { name: 'lP', value: `${newPrestige.lP}`, inline: true },
        //    {name: `Total:`, value: `${totalNewPrestige} Prestige`, inline: false}
        //)
        .setThumbnail(avatarUrl)
        //.setFooter({iconURL: `https://i.imgur.com/y4Gpo0V.png`})
        .setTimestamp(Date.now())

    embedsSent.push(embedReply)

    await interaction.channel.send({ embeds: [embedReply] })
}

const sendAuditLogEmbed = async(interaction, robloxName, prestige, reason) => {
    //console.log(interaction.guild.channels)
    const channel = interaction.guild.channels.cache.find(channel => channel.id == auditLogChannel)

    if (channel) {

        let description = ``

        let userAwardingPrestige = interaction.user
        if (userAwardingPrestige) {
            description += `**${userAwardingPrestige.username}#${userAwardingPrestige.discriminator}** awarded `
        }

        if (description == ``) {
            description = "Awarded "
        }

        description += `**${robloxName}** `

        let multiple = false
        given = Object.keys(prestige).map((type) => {
            if (prestige[type] !== 0) {
                if (!multiple) {
                    description += `${prestige[type]} ${type}`
                    multiple = true
                } else {
                    description += `, ${prestige[type]} ${type}`
                }
            }
        })
        description +=`\n`
        description += `**Reason:** ${reason}`
        

        const embedReply = new MessageEmbed()
        .setColor(`#FFA500`)
        .setTitle(`Audit Log`)
        .setAuthor({
            name: "Prestige Infocenter",
            iconURL: "https://i.imgur.com/y4Gpo0V.png"
        })
        .setImage('https://i.imgur.com/910F0td.png')
        // Given prestige
        .setDescription(`${description}`)
        .setTimestamp(Date.now())
        
        
        await channel.send({embeds: [embedReply]})
    } 
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
        //console.log(`NEXT RANK ID: ${nextRankId}`)

        const secondaryPrestige = nextRankInfo.secondaryPrestige
        let secondaryTypes

        for (const type of secondaryPrestige) {
            if (secondaryTypes == null) {
                secondaryTypes = type
            } else {
                secondaryTypes = secondaryTypes + "/" + type
            }
            
        }
       //console.log(secondaryTypes)
        return {
            ["RankName"] : nextRankInfo.name,
            ["Total"] : nextRankInfo.total,
            ["TotalSecondary"] : nextRankInfo.secondaryPrestigeValue,
            ["SecondaryTypes"] : secondaryTypes
        }
    }
    return
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
        return {["RankId"] : highestRankId, ["CurrentRankName"]: currentRankName}
    }
    let previousId = 1
    let previousName = rankData["1"].name
    for (const [name, rank] of Object.entries(rankData)) {
        const id = Number(name)//rank.id
        // Check total prestige requirement met
        //console.log(`TOTAL PRESTIGE NEEDED FOR RANK ${name}: ${rank.total}; CURRENT TOTAL PRESTIGE: ${currentTotalPrestige}`)
        if (currentTotalPrestige < rank.total) { //if (prestige[rank.mainPrestige] < rank.mainPrestigeValue) {
            // Main prestige requirement NOT met
            if (id <= highestRankId && previousId > 0) {
                await noblox.setRank(process.env.GROUP, robloxId, previousId)//6870149, robloxId, highestRankId)
                console.log(`USER WAS DEMOTED TO RANK ${previousId} DUE TO NOT HAVING THE APPROPRIATE TOTAL NUMBER OF PRESTIGE`)
                highestRankId = previousId
                highestRankName = previousName
            }
            //break
            return {["CurrentRankId"]: currentRankId, ["NewRankId"] : highestRankId, ["CurrentRankName"]: currentRankName, ["NewRankName"]: highestRankName}
        }

        let secondaryTotal = 0
        let secondaryPrestige = rank.secondaryPrestige

        for (const type of secondaryPrestige) {
            secondaryTotal += prestige[type]
        }
        //console.log(`SECONDARY PRESTIGE TOTAL: ${secondaryTotal}`)
        if (secondaryTotal < rank.secondaryPrestigeValue) {
           // Secondary prestige NOT met
            if (id <= highestRankId && previousId > 0) {
                await noblox.setRank(process.env.GROUP, robloxId, id)//6870149, robloxId, highestRankId)
                console.log(`USER WAS DEMOTED TO RANK ${previousId} DUE TO NOT HAVING THE APPROPRIATE SECONDARY PRESTIGE TOTAL`)
                highestRankId = previousId
                highestRankName = previousName
            }
            //break
            return {["CurrentRankId"]: currentRankId, ["NewRankId"] : highestRankId, ["CurrentRankName"]: currentRankName, ["NewRankName"]: highestRankName}
        }

        //console.log(`id: ${id}; highestRankId: ${highestRankId}`)
        if (id > highestRankId) { console.log("YES")
            highestRankId = id
            highestRankName = rank.name
        }

        //console.log(`highest rank ID: ${highestRankId}; currentRankId: ${currentRankId}`)
        previousId = id
        previousName = rank.name
    }
 
    if (highestRankId > currentRankId) {
        console.log("PROMOTING")
        await noblox.setRank(process.env.GROUP, robloxId, highestRankId)//6870149, robloxId, highestRankId)
        console.log("PROMOTED!!!")
        //return {["RankId"] : highestRankId, ["RankName"]: highestRankName}//highestRankName
        return {["CurrentRankId"]: currentRankId, ["NewRankId"] : highestRankId, ["CurrentRankName"]: currentRankName, ["NewRankName"]: highestRankName}
    }
    //console.log("HIGHEST RANK NAME: " + highestRankName)
    return {["CurrentRankId"]: currentRankId, ["CurrentRankName"]: currentRankName} //highestRankName
}

const run = async (client, interaction) => {
    await interaction.reply("Awarding prestige...")
    let members = interaction.options.getString("user")
    let prestige = {
        sP: interaction.options.getNumber("sp") || 0,
        dP: interaction.options.getNumber("dp") || 0,
        hP: interaction.options.getNumber("hp") || 0,
        lP: interaction.options.getNumber("lp") || 0
    }
    let reason = interaction.options.getString("reason")

    //Check if any prestige is actually being given:
    if (prestige.sP == 0 && prestige.dP == 0 && prestige.hP == 0 && prestige.lP == 0) {
        sendMiscErrorEmbed(interaction, "Must specify at least one type of prestige and an amount to award")
        return await interaction.followUp("Error awarding prestige")
    }

    if (interaction.member.id !== process.env.OWNER) {

        //Check if player is allowed to give leadership prestige (must be highcom):
        let canGiveLeadershipPrestige = checkIfCanGiveLeadershipPrestige(interaction)
        if (!canGiveLeadershipPrestige) {
            sendMiscErrorEmbed(interaction, "You are not allowed to award Leadership Prestige")
            return await interaction.followUp("Error awarding prestige")
        }

        //Check if giving or taking away too much prestige
        let givingTooMuchPrestigeErrorMessage
        Object.keys(prestigeLimits).forEach(type => {
            if (Math.abs(prestige[type]) > prestigeLimits[type]) {
                givingTooMuchPrestigeErrorMessage = `Awarding too much ${prestigeNames[type]} Prestige (Limit: ${prestigeLimits[type]})`
            }
        })

        if (givingTooMuchPrestigeErrorMessage) {
            sendMiscErrorEmbed(interaction, givingTooMuchPrestigeErrorMessage)
            return await interaction.followUp("Error awarding prestige")
        }

    }

    let membersText = String(members.replace(/[,@<>!]/g, ""))
    membersText = membersText.replace(/\s\s+/g, ' ');
    let memberArray = membersText.split(" ")
    //interaction.deferReply();

    if (!reason) return interaction.followUp("Invalid reason")

    const robloxData = await getRobloxUsersFromMembers(memberArray)
    //console.log(robloxData)
    if (!robloxData) return await interaction.followUp("Could not retrieve roblox data")

    let embedsSent = []
    for (const player of robloxData) {

        if (!player) {
            interaction.channel.send("Invalid player")
        } //return interaction.reply("Invalid discord user id")

        try {
            const robloxId = player.id || player.robloxId
            const robloxName = player.name || player.cachedUsername

            if (robloxId && robloxName) {
                console.log(`AWARDING PRESTIGE TO ${robloxName}`)
                const newPrestige = await givePrestige(String(robloxId), robloxName, prestige)
                
                const rankInfo = await tryPromote(robloxId, newPrestige)
                const currentRankName = rankInfo.CurrentRankName
                const newRankName = rankInfo.NewRankName

                const currentRankId = rankInfo.CurrentRankId
                const newRankId = rankInfo.NewRankId
                //console.log(`${rankName} ${rankId}`)
                let changeRankAction
                if (currentRankName && newRankName && currentRankId && newRankId) {
                    if (Number(currentRankId) < Number(newRankId)) {
                        changeRankAction = "Promoted"
                    } else if (Number(currentRankId) > Number(newRankId)) {
                        changeRankAction = "Demoted"
                    }
                }

                let nextRankInfo
                if (!newRankName && !newRankId && currentRankId && currentRankName) {
                    nextRankInfo = await getNextRankInfo(currentRankId, currentRankName)
                } else if (newRankName && newRankId){
                    nextRankInfo = await getNextRankInfo(newRankId, newRankName)
                }
                sendSuccessEmbed(robloxId, robloxName, currentRankName, newRankName, changeRankAction, prestige, newPrestige, nextRankInfo, interaction, reason, embedsSent)
                sendAuditLogEmbed(interaction, robloxName, prestige, reason)
            } else {
                sendCouldNotFindEmbed(player, interaction)
            }
        }

        catch (err) {
            if (err) {
                console.error(err)
                await interaction.channel.send(`Failed awarding prestige to ${player}`)
            }
        }
    }

    await sendFinalSuccessEmbed(interaction)

    return await interaction.followUp("Awarded prestige!")

}

module.exports = {
    name: "prestige",
    description: "Add prestige to a member",
    //perm: "KICK_MEMBERS",

    //Different tiers for command use
    highcomPerm: process.env.ADMIRAL_ROLE,
    officerPerm: process.env.OFFICER_ROLE, 

    rolePermission: process.env.OFFICER_ROLE, //Role required to use the command at all

    allowedChannels: ["1046994370622132295", "1047690023870402610"],

    options: [
        {
            name: "user",
            description: "The user(s) to give prestige (roblox name(s) or discord @(s))",
            type: 3,//6, //USER 
            required: true
        },
        {
            name: "reason",
            description: "Reason for prestige",
            type: 3, //STRING
            required: true
        },
        {
            name: "sp",
            description: `Amount of Strength Prestige (LIMIT: ${prestigeLimits['sP']})`,
            type: 10, //Number //3, //STRING
            required: false
        },
        {
            name: "dp",
            description: `Amount of Discipline Prestige (LIMIT: ${prestigeLimits['dP']})`,
            type: 10, //Number //3, //STRING
            required: false
        },
        {
            name: "hp",
            description: `Amount of Honor Prestige (LIMIT: ${prestigeLimits['hP']})`,
            type: 10, //Number //3, //STRING
            required: false
        },
        {
            name: "lp",
            description: `Amount of Leadership Prestige (LIMIT: ${prestigeLimits['lP']})`,
            type: 10, //Number //3, //STRING
            required: false
        },
    ],
    run
}