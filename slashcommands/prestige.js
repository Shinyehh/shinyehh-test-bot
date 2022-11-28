const firebase = require('firebase/app');
const fieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json')
const owner = process.env.OWNER

const getRobloxData = async (userID) => {
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

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let db = admin.firestore();

const run = async (client, interaction) => {
    let member = interaction.options.getString("user")//getMember("user")
    let sP = interaction.options.getNumber("sp") || 0
    let kP = interaction.options.getNumber("kp") || 0
    let hP = interaction.options.getNumber("hp") || 0
    let lP = interaction.options.getNumber("lp") || 0
    let reason = interaction.options.getString("reason")

    //console.log(member)
    member = String(member.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()<>@]/g, ""))
    console.log(member)
    
    if (!member) return interaction.reply("Invalid member")
    if (!reason) return interaction.reply("Invalid reason")

    try {

        console.log("AWARDING PRESTIGE")  
        const robloxData = await getRobloxData(member)
        const robloxId = String(robloxData.robloxId)
        console.log(robloxData)
        console.log(robloxId)

        //console.log(robloxUserID)

        const prestigeRef = db.collection('PrestigeDatabase').doc(robloxId)//(member.id);
        const doc = await prestigeRef.get();

        if (!doc.exists) {
            console.log('No such document!');
        } else {
            console.log('Document data:', doc.data());

            console.log(Object.keys(doc.data()).length)
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
        }

         return interaction.reply(`${robloxData.cachedUsername} has been given ${sP} sP, ${kP} kP, ${hP} hP, ${lP} lP for ${reason}`)
    }
    catch(err){
        if (err){
            console.error(err)
            return interaction.reply(`Failed to award prestige to ${robloxData.cachedUsername}`)
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