const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')
const { getRankNameInGUF, getRobloxUsersFromMembers } = require('../lib/functions')
const { db } = require('../lib/firebase')

const prestigeLimits = {
    ["sP"] : 10,
    ["kP"] : 5,
    ["hP"] : 7,
    ["lP"] : 3,
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

    let prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)
    let doc = await prestigeRef.get()

    if (!doc.exists) {
        console.log(`Creating database profile for ${robloxName}`);
        createDatabaseProfile(robloxId, prestige)

        return {
            ["sP"] : sP || 0,
            ["kP"] : kP || 0,
            ["hP"] : hP || 0,
            ["lP"] : lP || 0
        }

     } else {
        const data = doc.data()
    
        if (Object.keys(data).length === 0) {
            db.collection('PrestigeDatabase').doc(robloxId).set({
                'sP': sP || 0,
                'kP': kP || 0,
                'hP': hP || 0,
                'lP': lP || 0,
            });

            return {
                ["sP"] : sP || 0,
                ["kP"] : kP || 0,
                ["hP"] : hP || 0,
                ["lP"] : lP || 0,
             }  
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
                ["sP"] : currentsP + sP,
                ["kP"] : currentkP + kP,
                ["hP"] : currenthP + hP,
                ["lP"] : currentlP + lP
             }  
        }
 
    }   //doc.data()
}

const sendRedErrorEmbed = async (interaction, msg) => {
    await interaction.channel.send({ embeds: [
        new MessageEmbed()
        .setColor("RED")
        .setAuthor({
            name: "Prestige Infocenter",
            iconURL: "https://i.imgur.com/y4Gpo0V.png"
        })
        .setTitle(`Error`)
        .setDescription(msg)
        .setImage('https://i.imgur.com/910F0td.png')
        .setTimestamp(Date.now())
    ]})
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
    if (prestige.sP == 0 && prestige.kP == 0 && prestige.hP == 0 && prestige.lP == 0){
        sendRedErrorEmbed(interaction, "Must specify at least one type of prestige and an amount to award")
        return await interaction.followUp("Error awarding prestige")
    }

    //Check if giving or taking away too much prestige
    let givingTooMuchPrestigeErrorMessage
    if (Math.abs(prestige.sP) > prestigeLimits.sP) {
        givingTooMuchPrestigeErrorMessage = `Awarding too much Strength Prestige (Limit: ${prestigeLimits.sP})`
    } else if (Math.abs(prestige.kP) > prestigeLimits.kP) {
        givingTooMuchPrestigeErrorMessage = `Awarding too much Knowledge Prestige (Limit: ${prestigeLimits.kP})`
    } else if (Math.abs(prestige.hP) > prestigeLimits.hP) {
        givingTooMuchPrestigeErrorMessage = `Awarding too much Honor Prestige (Limit: ${prestigeLimits.hP})`
    } else if (Math.abs(prestige.lP) > prestigeLimits.lP) {
        givingTooMuchPrestigeErrorMessage = `Awarding too much Leadership Prestige (Limit: ${prestigeLimits.lP})`
    }
    if (givingTooMuchPrestigeErrorMessage) {
        sendRedErrorEmbed(interaction, givingTooMuchPrestigeErrorMessage)
        return await interaction.followUp("Error awarding prestige")
    }

    if (Math.abs(prestige.hP) > prestigeLimits.hP) {
        sendRedErrorEmbed(interaction, `Awarding too much Honor Prestige (Limit: ${prestigeLimits.hP})`)
        return await interaction.followUp("Error awarding prestige")
    }

    if (Math.abs(prestige.lP) > prestigeLimits.lP) {
        sendRedErrorEmbed(interaction, `Awarding too much Leadership Prestige (Limit: ${prestigeLimits.lP})`)
        return await interaction.followUp("Error awarding prestige")
    }

    sendRedErrorEmbed(interaction, `Awarding too much Strength Prestige (Limit: ${prestigeLimits.sP})`)
    return await interaction.followUp("Error awarding prestige")
    let membersText = String(members.replace(/[,@<>!]/g, ""))
    membersText = membersText.replace(/\s\s+/g, ' ');
    let memberArray = membersText.split(" ")
    //interaction.deferReply();
    
    let embedsSent = []
    if (!reason) return await interaction.followUp("Invalid reason")

    const robloxData = await getRobloxUsersFromMembers(memberArray)
    console.log(robloxData)
    if (!robloxData) return await interaction.followUp("Could not retrieve roblox data")

    //console.log(robloxData)
    for (const player of robloxData) {

        if (!player) {
            interaction.channel.send("Invalid player")
        } //return interaction.reply("Invalid discord user id")

        try {
            let robloxId = player.id || player.robloxId
            let robloxName = player.name || player.cachedUsername
            //console.log(player)
            if (robloxId && robloxName) {
                console.log(`AWARDING PRESTIGE TO ${robloxName}`)
                const newPrestige = await givePrestige(String(robloxId), robloxName, prestige)

                const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
                const avatarUrl = avatarData[0].imageUrl

                const rankName = await getRankNameInGUF(robloxId)

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

            } else { 
                //Could not find roblox data from supplied username or discord id:
                let requestedName = player.requestedUsername
                let found = player.found

                let discordErrorCode = player.errorCode
                let discordId = player.discordId
                if ((requestedName && found == "Not Found") || (discordErrorCode && discordId)) {
                    let msg
                    if (requestedName) {
                        msg = `Could not find roblox data for ${requestedName}`
                    } else {
                        msg = `Could not find roblox data for discord user <@!${discordId}>`
                    }
                    sendRedErrorEmbed(interaction, msg)
                }
            }
        }

        catch (err) {
            if (err) {
                console.error(err)
                await interaction.channel.send(`Failed awarding prestige to ${player}`)
            }
        }
    }
    //if (!interaction.replied) {
        const authorRobloxData = await getRobloxUsersFromMembers([interaction.user.id])
        if (authorRobloxData && authorRobloxData[0]) {
            let robloxId = authorRobloxData[0].robloxId
            let robloxName = authorRobloxData[0].cachedUsername

            if (robloxId && robloxName) {
                const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
                const avatarUrl = avatarData[0].imageUrl
                
                const rankName = await getRankNameInGUF(robloxId)
 
                await interaction.channel.send({ embeds: [
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
                ]})
            }
        }
    //}
    return await interaction.followUp("Awarded prestige!")
    
}

module.exports = {
    name: "prestige",
    description: "Add prestige to a member",
    //perm: "KICK_MEMBERS",

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
/*
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