const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')

const { getRobloxUsersFromMembers } = require('../lib/functions')
const { db } = require('../lib/firebase')

const createDatabaseProfile = async (robloxId) => {
    db.collection('PrestigeDatabase').doc(robloxId).set({
        'sP': 0,
        'kP': 0,
        'hP': 0,
        'lP': 0,
    });
}

const givePrestige = async (robloxId, robloxName, prestige) => {
    ({ sP, kP, hP, lP } = prestige)

    let prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)
    let doc = await prestigeRef.get()

    if (!doc.exists) {
        console.log(`Creating database profile for ${robloxName}`);
        createDatabaseProfile(robloxId)

        prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)
        doc = await prestigeRef.get()
    }

    if (!doc.exists) {
        console.log(`Error giving prestige to ${robloxId}`)
        return
    }
    const data = doc.data()
    console.log('Document data:', data);

    if (Object.keys(data).length === 0) {
        db.collection('PrestigeDatabase').doc(robloxId).set({
            'sP': sP || 0,
            'kP': kP || 0,
            'hP': hP || 0,
            'lP': lP || 0,
        });
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
    }

    return doc.data()
}

const run = async (client, interaction) => {
    let members = interaction.options.getString("user")
    let prestige = {
        sP: interaction.options.getNumber("sp") || 0,
        kP: interaction.options.getNumber("kp") || 0,
        hP: interaction.options.getNumber("hp") || 0,
        lP: interaction.options.getNumber("lp") || 0
    }
    let reason = interaction.options.getString("reason")

    console.log(members)
    let membersText = String(members.replace(/[,@<>!]/g, ""))
    membersText = membersText.replace(/\s\s+/g, ' ');
    let memberArray = membersText.split(" ")
    interaction.deferReply();

    let embedsSent = []
    if (!reason) return interaction.reply("Invalid reason")

    const robloxData = await getRobloxUsersFromMembers(memberArray)
    if (!robloxData) return interaction.repy("Could not retrieve roblox data")

    console.log(robloxData)
    for (const player of robloxData) {

        if (!player) {
            interaction.channel.send("Invalid player")
        } //return interaction.reply("Invalid discord user id")

        try {
            let robloxId = player.id
            let robloxName = player.name
            console.log("before")
            console.log(player)
            console.log("after")
            if (robloxId && robloxName) {
                console.log(`AWARDING PRESTIGE TO ${robloxName}`)
                const newPrestige = await givePrestige(String(robloxId), robloxName, prestige)
                console.log(newPrestige)

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

                    .setTitle(`Conscript ${robloxName}`)
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
        }

        catch (err) {
            if (err) {
                console.error(err)
                await interaction.channel.send(`Failed awarding prestige to ${player}`)
            }
        }
    }
    interaction.deleteReply();
}

module.exports = {
    name: "prestige",
    description: "Add prestige to a member",
    perm: "KICK_MEMBERS",
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
            description: "Amount of Strength Prestige",
            type: 10, //Number //3, //STRING
            required: false
        },
        {
            name: "kp",
            description: "Amount of Knowledge Prestige",
            type: 10, //Number //3, //STRING
            required: false
        },
        {
            name: "hp",
            description: "Amount of Honor Prestige",
            type: 10, //Number //3, //STRING
            required: false
        },
        {
            name: "lp",
            description: "Amount of Leadership Prestige",
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