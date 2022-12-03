const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')
const { getRankNameInGUF, getRankIdInGUF, getRankNameFromID, getRobloxUsersFromMembers } = require('../lib/functions')
const { db } = require('../lib/firebase')
const rankData = require('../config/ranks.json')

const prestigeLimits = {
    sP: 10,
    kP: 5,
    hP: 6,
    lP: 5
}

const prestigeNames = {
    sP: 'Strength',
    kP: 'Knowledge',
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
    ({ sP, kP, hP, lP } = prestige)

    db.collection('PrestigeDatabase').doc(robloxId).set({
        'sP': sP || 0,
        'kP': kP || 0,
        'hP': hP || 0,
        'lP': lP || 0,
    });
}

const givePrestige = async (robloxId, robloxName, prestige) => {

    ({ sP, kP, hP, lP } = prestige)
    const basePrestige = {
        'sP': sP || 0,
        'kP': kP || 0,
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
            const currentkP = data.kP || 0
            const currenthP = data.hP || 0
            const currentlP = data.lP || 0

            db.collection('PrestigeDatabase').doc(robloxId).set({
                'sP': currentsP + sP,
                'kP': currentkP + kP,
                'hP': currenthP + hP,
                'lP': currentlP + lP,
            });

            return {
                'sP': currentsP + sP,
                'kP': currentkP + kP,
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

const sendSuccessEmbed = async (robloxId, robloxName, rankName, prestige, newPrestige, interaction, embedsSent) => {

    const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
    const avatarUrl = avatarData[0].imageUrl

    let description = ``
    // Add given prestige to description
    given = Object.keys(prestige).map((type) => {
        if (prestige[type] !== 0) {
            description += `${newPrestige[type] - prestige[type]}${type} -> ${newPrestige[type]}${type} **(+${prestige[type]}${type})** \n`
        }
    })

    // Add next rank information
    description += `\nNext Rank: **Soldier (10sP)**\n`

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
            { name: 'kP', value: `${newPrestige.kP}`, inline: true },
            { name: 'hP', value: `${newPrestige.hP}`, inline: true },
            { name: 'lP', value: `${newPrestige.lP}`, inline: true },
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

const tryPromote = async (robloxId, prestige) => {
    const currentRankId = await getRankIdInGUF(robloxId)
    const currentRankName = await getRankNameInGUF(robloxId)

    let highestRankId = currentRankId
    let highestRankName = currentRankName

    for (const [name, rank] of Object.entries(rankData)) {
        const id = Number(name)//rank.id
        // Check main prestige requirement met
        if (prestige[rank.mainPrestige] < rank.mainPrestigeValue) {
            // Main prestige requirement NOT met
            if (id < highestRankId) {
                console.log("DEMOTING")
                await noblox.setRank(process.env.GROUP, robloxId, id)//6870149, robloxId, highestRankId)
                console.log("DEMOTED!!!")
            }
            return
        }

        let secondaryTotal = 0
        let secondaryPrestige = rank.secondaryPrestige

        for (const type of secondaryPrestige) {
            secondaryTotal += prestige[type]
        }
        console.log("secondary total:")
        console.log(secondaryTotal)
        if (secondaryTotal < rank.secondaryPrestigeValue) {
           // Secondary prestige NOT met
            if (id < highestRankId) {
                console.log("DEMOTING")
                await noblox.setRank(process.env.GROUP, robloxId, id)//6870149, robloxId, highestRankId)
                console.log("DEMOTED!!!")
            }
            return
        }

        console.log(`id: ${id}; highestRankId: ${highestRankId}`)
        if (id > highestRankId) { console.log("YES")
            highestRankId = id
            highestRankName = name
        }

        console.log(`highest rank ID: ${highestRankId}; currentRankId: ${currentRankId}`)
        if (highestRankId !== currentRankId) {
            console.log("PROMOTING")
            await noblox.setRank(process.env.GROUP, robloxId, highestRankId)//6870149, robloxId, highestRankId)
            console.log("PROMOTED!!!")
            return highestRankName
        }
    }
    return highestRankName
}

const run = async (client, interaction) => {
    await interaction.reply("Awarding prestige...")
    let members = interaction.options.getString("user")
    let prestige = {
        sP: interaction.options.getNumber("sp") || 0,
        kP: interaction.options.getNumber("kp") || 0,
        hP: interaction.options.getNumber("hp") || 0,
        lP: interaction.options.getNumber("lp") || 0
    }
    let reason = interaction.options.getString("reason")

    //Check if any prestige is actually being given:
    if (prestige.sP == 0 && prestige.kP == 0 && prestige.hP == 0 && prestige.lP == 0) {
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
    console.log(robloxData)
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
                const rankName = tryPromote(robloxId, newPrestige)

                sendSuccessEmbed(robloxId, robloxName, rankName, prestige, newPrestige, interaction, embedsSent)
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

    highcomPerm: process.env.ADMIRAL_ROLE,
    officerPerm: process.env.OFFICER_ROLE,

    rolePermission: process.env.OFFICER_ROLE,

    options: [
        {
            name: "user",
            description: "The user to give prestige",
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
            name: "kp",
            description: `Amount of Knowledge Prestige (LIMIT: ${prestigeLimits['kP']})`,
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