const { MessageEmbed } = require('discord.js')

const firebase = require('firebase/app');
const fieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json')
const owner = process.env.OWNER

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let db = admin.firestore();

const getRobloxDataFromDiscordUserId = async (userID) => {
    const API = 'rvr2g07xysnls52yj4cbykz75ubhxe5chidx96xukkl5vkncl1r1p4yw4impqfsm0ba'
    const guildID = '1045539034811875408'
    const url = `http://registry.rover.link/api/guilds/${guildID}/discord-to-roblox/${userID}`

    let request = await fetch(url, {
        headers: {
            Authorization: `Bearer ${API}`
        }
    })
    response = await request.json()
    return response
}

const getRobloxDataFromRobloxName = async (name) => {
    const url = `https://api.roblox.com/users/get-by-username?username=${name}`

    let request = await fetch(url)
    response = await request.json()
    return response
}

const createDatabaseProfile = async (robloxId) => {
    db.collection('PrestigeDatabase').doc(robloxId).set({
        'sP' : 0,
        'kP' : 0,
        'hP' : 0,
        'lP' : 0,
    });
}

const run = async (client, interaction) => {
    let member = interaction.options.getString("user")//getMember("user")
    let sP = interaction.options.getNumber("sp") || 0
    let kP = interaction.options.getNumber("kp") || 0
    let hP = interaction.options.getNumber("hp") || 0
    let lP = interaction.options.getNumber("lp") || 0
    let reason = interaction.options.getString("reason")

    //console.log(member)
    let memberText = String(member.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()<>@]/g, ""))
    //memberText = memberText.replace(/\s\s+/g, ' ');
    //let memberArray = memberText.split(" ")

    //for (const m of memberArray){
    //    console.log(m)
    //}

    let discordUserId

    let robloxData;
    let robloxId;
    let robloxName;

    //console.log(discordUserId)
    
    if (!member || !memberText) return interaction.reply("Invalid discord user id")
    if (!reason) return interaction.reply("Invalid reason")

    try {
        console.log("AWARDING PRESTIGE")  

        const memberTextIsANumber = Number(memberText)
        
        //Assuming we are awarding prestige to someone based on Username:
        if (String(memberTextIsANumber) === "NaN") {
       
            let searchName = memberText
            robloxData = await getRobloxDataFromRobloxName(searchName)

            if (!robloxData){
                let msg = `No roblox data exists for ${member}`
                console.log(msg)
                return interaction.reply(msg)
            }
            robloxId = String(robloxData.Id)
            robloxName = robloxData.Username
            if (!robloxId || !robloxName){
                let msg = `No roblox user id/name exists for ${member}`
                console.log(msg)
                return interaction.reply(msg)
            }

        //Award prestige based on their discord handle:            
        } else {
            discordUserId = memberText
            robloxData = await getRobloxDataFromDiscordUserId(discordUserId)
            if (!robloxData){
                let msg = `No roblox data exists for ${member}`
                console.log(msg)
                return interaction.reply(msg)
            }
            robloxId = String(robloxData.robloxId)
            robloxName = robloxData.cachedUsername
            if (!robloxId || !robloxName){
                let msg = `No roblox user id/name exists for ${member}`
                console.log(msg)
                return interaction.reply(msg)
            }
        }
        
        let prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)//(member.id);
        let doc = await prestigeRef.get();

        if (!doc.exists) {
            console.log(`Creating database profile for ${robloxName}`);
            createDatabaseProfile(robloxId)

            prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)//(member.id);
            doc = await prestigeRef.get();
        } 
        
        if (!doc.exists){
            console.log(`Error giving prestige to ${robloxId}`)
            return
        }
        console.log('Document data:', doc.data());
       // console.log(Object.keys(doc.data()).length)

        if (Object.keys(doc.data()).length === 0) {
            db.collection('PrestigeDatabase').doc(robloxId).set({
                'sP' : sP || 0,
                'kP' : kP || 0,
                'hP' : hP || 0,
                'lP' : lP || 0,
            });
        } else {
            const currentsP = doc.data().sP || 0
            const currentkP = doc.data().kP || 0
            const currenthP = doc.data().hP || 0
            const currentlP = doc.data().lP || 0

            db.collection('PrestigeDatabase').doc(robloxId).set({
                'sP' : currentsP + sP,
                'kP' : currentkP + kP,
                'hP' : currenthP + hP,
                'lP' : currentlP + lP,
            });
        }

        const embedReply = new MessageEmbed()
            .setColor(0x0099FF)
            .setTitle(robloxName)
            .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
            .setAuthor({
                name: "Prestige Database System",
                iconURL: "https://imgur.com/a/pgeEL1W"
            })
            .setDescription(`${robloxName} has been given ${sP} sP, ${kP} kP, ${hP} hP, ${lP} lP for ${reason}`)
         //return interaction.reply(`${robloxName} has been given ${sP} sP, ${kP} kP, ${hP} hP, ${lP} lP for ${reason}`)
        return interaction.reply({embeds: [embedReply]})
    }
    catch(err){
        if (err){
            console.error(err)
            return interaction.reply(`Failed to award prestige to ${robloxName || 'nil'}`)
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
            description: "The user to kick",
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