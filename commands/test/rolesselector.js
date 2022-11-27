const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")

module.exports = {
    name: "rolesselector",
    category: "test",
    devOnly: true,
    run: async ({client, message, args}) => {
        message.channel.send({
            embeds: [
                new MessageEmbed().setTitle("Select Role").setDescription("Select roles from the buttons below").setColor("BLUE") 
            ],
            components: [
                new MessageActionRow().addComponents([
                    new MessageButton().setCustomId("role-1046512030070349884").setStyle("PRIMARY").setLabel("Idiot"),
                    new MessageButton().setCustomId("role-1046512063247306823").setStyle("PRIMARY").setLabel("Stupid")
                ])
            ]
       }) 
    }
}

//1046512063247306823
//1046512117886500896