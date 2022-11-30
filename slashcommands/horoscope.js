const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")

const signsChoices = [
    {name: "Aries", value: "Aries"},
    {name: "Taurus", value: "Taurus"},
    {name: "Gemini", value: "Gemini"},
    {name: "Cancer", value: "Cancer"},
    {name: "Leo", value: "Leo"},
    {name: "Virgo", value: "Virgo"},
    {name: "Libra", value: "Libra"},
    {name: "Scorpio", value: "Scorpio"},
    {name: "Sagittarius", value: "Sagittarius"},
    {name: "Capricorn", value: "Capricorn"},
    {name: "Aquarius", value: "Aquarius"},
    {name: "Pisces", value: "Pisces"},
]

const signsImages = {
    ["Aries"] : "https://hips.hearstapps.com/hmg-prod/images/aries-zodiac-sign-abstract-night-sky-background-royalty-free-image-1584536731.jpg?crop=0.66777xw:1xh;center,top&resize=1200:*",
    ["Taurus"] : "https://hips.hearstapps.com/hmg-prod/images/taurus-zodiac-sign-abstract-night-sky-background-royalty-free-image-1587395874.jpg?crop=0.66777xw:1xh;center,top&resize=1200:*",
    ["Gemini"] : "https://hips.hearstapps.com/hmg-prod/images/gemini-zodiac-sign-abstract-night-sky-background-royalty-free-image-1590508367.jpg",
    ["Cancer"] : "https://hips.hearstapps.com/hmg-prod/images/cancer-zodiac-sign-abstract-night-sky-background-royalty-free-image-858078918-1560803578.jpg",
    ["Leo"] : "https://hips.hearstapps.com/hmg-prod/images/leo-zodiac-sign-abstract-night-sky-background-royalty-free-image-858075636-1563569425.jpg",
    ["Virgo"] : "Vhttps://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/september-horoscope-1534965429.jpg?crop=1.00xw:1.00xh;0,0&resize=480:*",
    ["Libra"] : "https://hips.hearstapps.com/hmg-prod/images/libra-zodiac-sign-abstract-night-sky-background-royalty-free-image-1568910403.jpg?crop=1.00xw:0.751xh;0,0.0959xh&resize=1200:*",
    ["Scorpio"] : "https://hips.hearstapps.com/hmg-prod/images/scorpio-zodiac-sign-abstract-night-sky-background-royalty-free-image-1571399986.jpg",
    ["Sagittarius"] : "https://www.thelist.com/img/gallery/heres-how-being-a-sagittarius-could-affect-your-mental-health/l-intro-1621353446.jpg",
    ["Capricorn"] : "https://hips.hearstapps.com/hmg-prod/images/capricorn-zodiac-sign-abstract-night-sky-background-royalty-free-image-1576705058.jpg",
    ["Aquarius"] : "https://hips.hearstapps.com/hmg-prod/images/libra-zodiac-sign-abstract-night-sky-background-royalty-free-image-1568910403.jpg",
    ["Pisces"] : "https://www.thelist.com/img/gallery/heres-what-pisces-season-will-mean-for-your-zodiac-sign/intro-1614095688.jpg",
}

const days = [
    {name: "Today", value: "Today"},
    {name: "Yesterday", value: "Yesterday"},
    {name: "Tomorrow", value: "Tomorrow"},
]

const getHoroscope = async (interaction, givenSign, givenDay) => {
    const url = `https://sameer-kumar-aztro-v1.p.rapidapi.com/?sign=${givenSign}&day=${givenDay}`

    const options = {
        method: 'POST',
        headers: {
            'X-RapidAPI-Key': '168a47d7f2msh7b62394195a5a3bp1f61a8jsn6b50a0cd35a0',
            'X-RapidAPI-Host': 'sameer-kumar-aztro-v1.p.rapidapi.com'
          }
    };

    let request = await fetch(url, options)
    let response = await request.json()
    //console.log(response)
    return response
}

const toTitleCase = (str) => {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

const stringToColour = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 0xFF;
      colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
  }

const icon = "https://phantom-marca.unidadeditorial.es/01d759768d94a7fb4711e125d49775fb/crop/0x0/1320x743/resize/660/f/webp/assets/multimedia/imagenes/2022/05/09/16520814124194.jpg"

const run = async (client, interaction) => {
    let sign = interaction.options.getString("sign")
    let day = interaction.options.getString("day")

    if (!sign) return interaction.reply("Invalid sign")
    if (!day) return interaction.reply("Invalid day")

    try {
        const horoscopeData = await getHoroscope(interaction, sign, day)
        if (!interaction.replied && horoscopeData && horoscopeData.description) {
            return interaction.reply({//interaction.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(stringToColour(horoscopeData.color))
                        .setTitle(`${sign} (${horoscopeData.date_range})`)
                        //.setURL()
                        .setAuthor({name: `${toTitleCase(day)}'s Horoscope (${horoscopeData.current_date})`, iconURL: icon})
                        .setDescription(horoscopeData.description)
                        .setThumbnail(signsImages[`${sign}`])  
                        
                        .addFields(
                            {name: "Compatibility", value: horoscopeData.compatibility, inline: true},
                            {name: "Mood", value: horoscopeData.mood, inline: true},
                            {name: "Color", value: horoscopeData.color, inline: true},
                            {name: "Lucky Number", value: horoscopeData.lucky_number, inline: true},
                            {name: "Lucky Time", value: horoscopeData.lucky_time, inline: true}
                        )

                        .setTimestamp()
                       // .setFooter({iconURL: icon})
                ],
            })
        }
    }
    catch(err){
        if (err){
            console.error(err)
            if (!interaction.replied) {
                return interaction.reply(`Failed to retrieve your daily horoscope!`)
            }
        }
    }
}

module.exports = {
    name: "horoscope",
    description: "View your horoscope!",
    options: [
        {
            name: "sign",
            description: "Your astrological sign",
            type: 3, //STRING
            choices: signsChoices,
            required: true
        },
        {
            name: "day",
            description: "Day of horoscope reading",
            type: 3, //STRING
            choices: days,
            required: true
        },
    ], 
    run
}