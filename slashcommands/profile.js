const { getRobloxUsersFromMembers } = require('../lib/functions')
const { db } = require('../lib/firebase')
const { MessageEmbed } = require('discord.js')
const noblox = require('noblox.js')


const run = async (client, interaction) => {
    console.log(interaction)

    const data = await getRobloxUsersFromMembers([interaction.user.id])
    const { robloxId, robloxName } = data[0]

    const avatarData = await noblox.getPlayerThumbnail(robloxId, 48, 'png', true, 'headshot')
    const avatarUrl = avatarData[0].imageUrl

    const prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)
    const doc = await prestigeRef.get();
    let prestige = { sP: 0, kP: 0, lP: 0, hP: 0 }
    if (doc.exists) {
        prestige = doc.data()
    }

    // Add next rank information
    description += `Next Rank: **Soldier (10sP)**`

    interaction.reply({//interaction.channel.send({
        embeds: [
            new MessageEmbed()
                .setColor("BLUE")
                .setAuthor({
                    name: "Prestige Infocenter",
                    iconURL: "https://i.imgur.com/y4Gpo0V.png"
                })

                .setTitle(robloxName)
                .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
                .setThumbnail(avatarUrl)
                .setDescription(description)

                .addFields(
                    { name: 'sP', value: String(prestige.sP), inline: true },
                    { name: 'kP', value: String(prestige.kP), inline: true },
                    { name: 'hP', value: String(prestige.hP), inline: true },
                    { name: 'lP', value: String(prestige.lP), inline: true },
                )

                .setTimestamp(Date.now())
        ]
    })
}



module.exports = {
    name: "profile",
    description: "Get your GUF profile.",
    run
}