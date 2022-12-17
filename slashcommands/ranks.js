const { MessageEmbed } = require("discord.js")
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