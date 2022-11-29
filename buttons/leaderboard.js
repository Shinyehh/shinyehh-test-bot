const { MessageEmbed, ButtonInteraction } = require('discord.js')
const { db } = require('../lib/firebase')
const noblox = require('noblox.js')

const convertTopDataToString = async (data) => {
    let results = ''
    let count = 1
    for (const user of data) {
        const id = user[0]
        const prestige = user[1]
        const name = await noblox.getUsernameFromId(Number(id))
        results += `${count}. ${name}: ${prestige} Prestige \n`
        console.log(results)
        count++
    }

    return results
}

const getTopTotalPrestige = async () => {
    let prestigeRef = db.collection('PrestigeDatabase')
    let snapshot = await prestigeRef.get();

    let data = []
    snapshot.forEach(doc => {
        let totalPrestige = 0
        Object.values(doc.data()).forEach(prestige => {
            totalPrestige += prestige
        })
        const userId = doc.id
        data.push([userId, totalPrestige])
    })

    data.sort((first, second) => {
        return second[1] - first[1]
    })

    if (data.length > 10) {
        data = data.slice(0, 10)
    }

    return await convertTopDataToString(data)
}

const getTopPrestigeType = async (type) => {
    let prestigeRef = db.collection('PrestigeDatabase')
    let snapshot = await prestigeRef.where(type, '>', 0)
        .orderBy(type, 'desc').limit(10)
        .get();

    let data = []
    snapshot.forEach(doc => {
        const userId = doc.id
        const prestige = doc.data()[type]
        data.push([userId, prestige])
    })

    return await convertTopDataToString(data)
}


module.exports = {
    name: "leaderboard",

    run: async (bot, interaction, parameters) => {
        console.log(interaction)
        const category = parameters[0]
        if (!interaction.guild) {
            return interaction.reply({
                content: "This command can only be used in a guild",
                ephemeral: true
            })
        }

        let results = ''
        if (category == "all") {
            results = await getTopTotalPrestige()
        } else {
            results = await getTopPrestigeType(category)
        }


        const categoryTitles = {
            all: 'Total Prestige',
            kP: 'Knowledge Prestige',
            sP: 'Strength Prestige',
            lP: 'Leadership Prestige',
            hP: 'Honor Prestige'
        }

        const embedReply = new MessageEmbed()
            .setColor(0x0099FF)
            .setTitle(categoryTitles[category])
            .setAuthor({
                name: "Prestige Database System",
                iconURL: "https://i.imgur.com/y4Gpo0V.png"
            })
            .setDescription(results)
            .setTimestamp(Date.now())
        
        interaction.message.edit({ embeds: [embedReply] })
        interaction.deferReply();
        interaction.deleteReply();
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