const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")

const getReddit = async (interaction) => {
    const url = 'https://reddit-meme.p.rapidapi.com/memes/trending';

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '168a47d7f2msh7b62394195a5a3bp1f61a8jsn6b50a0cd35a0',
        'X-RapidAPI-Host': 'reddit-meme.p.rapidapi.com'
      }
    };

    let request = await fetch(url, options)
    let response = await request.json()
    //console.log(response)
    return response
}

const run = async (client, interaction) => {
   // let question = interaction.options.getString("question")

    try {
        const redditData = await getReddit(interaction)
        if (!interaction.replied && redditData) {
            console.log(redditData)
            if (redditData.url) {
                return interaction.reply(redditData.url)
            } else {
                let gifs = []
                let msg = ""
               redditData.forEach(function(datum, index) {
                    if (datum.url) {
                        gifs.push(datum.url)
                    }
                })
                gifs.forEach(function(url, index) {
                    msg = msg + ` ${url}`
                })
                return interaction.reply(msg)
            }
           
        }
    }
    catch(err){
        if (err){
            console.error(err)
            if (!interaction.replied) {
                return interaction.reply(`Failed to retrieve Reddit data!`)
            }
        }
    }
}

module.exports = {
    name: "reddit",
    description: "Find the newest trending memes from subreddit!",
    options: [
    ],
    run
}