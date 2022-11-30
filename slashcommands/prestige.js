const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')

const { getRobloxUserFromMember } = require('../lib/functions')
const { db } = require('../lib/firebase')

const createDatabaseProfile = async (robloxId) => {
    db.collection('PrestigeDatabase').doc(robloxId).set({
        'sP': 0,
        'kP': 0,
        'hP': 0,
        'lP': 0,
    });
}

const givePretige = async (robloxId, robloxName, prestige) => {
    ({ sP, kP, hP, lP } = prestige)

    let prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)
    let doc = await prestigeRef.get();

    if (!doc.exists) {
        console.log(`Creating database profile for ${robloxName}`);
        createDatabaseProfile(robloxId)

        prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)
        doc = await prestigeRef.get();
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
    let membersText = String(members.replace(/[,@<!]/g, ""))
    //memberText = memberText.replace(/\s\s+/g, ' ');
    let memberArray = membersText.split(" ")

    let embedsSent = []

    for (const member of memberArray) {

        if (!member) return interaction.reply("Invalid discord user id")
        if (!reason) return interaction.reply("Invalid reason")

        try {

            const { robloxId, robloxName } = await getRobloxUserFromMember(member)
            console.log(`AWARDING PRESTIGE TO ${robloxName}`)
            givePretige(robloxId, robloxName, prestige)

            const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
            const avatarUrl = avatarData[0].imageUrl

            const embedReply = new MessageEmbed()
                .setColor(0x0099FF)
                .setTitle(robloxName)
                .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
                .setThumbnail(avatarUrl)
                .setAuthor({
                    name: "Prestige Database System",
                    iconURL: "https://i.imgur.com/y4Gpo0V.png"
                })
                .setDescription(`${robloxName} has been given ${sP} sP, ${kP} kP, ${hP} hP, ${lP} lP for ${reason}`)
                .setTimestamp(Date.now())

            embedsSent.push(embedReply)
            let resp
            
            if (interaction.replied) {
               // resp = await interaction.editReply({ embeds: [embedReply], fetchReply: true })
                resp = await interaction.editReply({ embeds: embedsSent, fetchReply: true })
            } else {
              //  resp = await interaction.reply({ embeds: [embedReply], fetchReply: true })
              resp = await interaction.reply({ embeds: embedsSent, fetchReply: true })
            }
            //console.log(resp)

            //return interaction.reply({ embeds: [embedReply] })
        }
        catch (err) {
            if (err) {
                console.error(err)
                return interaction.reply(`Failed awarding prestige to ${member}`)//Failed to award prestige to ${robloxName || 'nil'}`)
            }
        }
    }

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