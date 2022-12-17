const { MessageEmbed } = require("discord.js")

const run = async (client, interaction) => {
    try {
        if (!interaction.replied) {

            let infocenterCommands = ``
            infocenterCommands += `‣**/prestige:** Award and remove different types and amounts of prestiges to and from users\n`
            infocenterCommands += `‣**/profile:** View how much prestige you or other users have, including other group-related information\n`
            infocenterCommands += `‣**/ranks:** View a detailed list of ranks and the requirements for earning them\n`

            let funCommands = ``
            funCommands += `‣**/horoscope:** Look up horoscope data for different astrological signs for different days\n`
            funCommands += `‣**/8ball:** Ask any question and await a response\n`

            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                    .setColor(`#FEE75C`)
                    .setTitle(`Commands`)
                    .setAuthor({
                        name: "Prestige Infocenter",
                        iconURL: "https://i.imgur.com/y4Gpo0V.png"
                    })
                    //.setDescription(description)
                    .addFields(                          
                        {name: "Infocenter Commands", value: infocenterCommands, inline: false},
                        {name: "Fun Commands", value: funCommands, inline: false},
                    )
                   // .setThumbnail(`https://i.imgur.com/y4Gpo0V.png`)
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
    name: "commands",
    description: "View a list of commands you can use with the Prestige Infocenter bot and what they do",
    //perm: "KICK_MEMBERS",

    //highcomPerm: process.env.ADMIRAL_ROLE,
    //officerPerm: process.env.OFFICER_ROLE,

    //rolePermission: process.env.OFFICER_ROLE,

    options: [],
    run
}