const firebase = require('firebase/app');
const fieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json')
const owner = process.env.OWNER

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let db = admin.firestore();

const run = async (client, interaction) => {
    let member = interaction.options.getMember("user")
    let amount = interaction.options.getNumber("amount")

    if (!member) return interaction.reply("Invalid member")
    if (!amount) return interaction.reply("Invalid amount")

    try {
       // await interaction.guild.members.kick(member, reason)
        //return interaction.reply(`${member.user.tag} has been kicked for ${reason}`)

        console.log("AWARDING PRESTIGE")

        const prestigeRef = db.collection('PrestigeDatabase').doc(member.id);
        const doc = await prestigeRef.get();
        if (!doc.exists) {
            console.log('No such document!');
        } else {
            console.log('Document data:', doc.data());

            console.log(Object.keys(doc.data()).length)
            if (Object.keys(doc.data()).length === 0) {
                db.collection('PrestigeDatabase').doc(member.id).set({
                    'prestige' : amount
                 });
            } else {
                const currentPrestige = doc.data().prestige
                console.log(currentPrestige)
                db.collection('PrestigeDatabase').doc(member.id).set({
                    'prestige' : currentPrestige + amount
                 });
            }
        }

         return interaction.reply(`${member.user.tag} has been given ${amount} prestige`)
    }
    catch(err){
        if (err){
            console.error(err)
            return interaction.reply(`Failed to award prestige to ${member.user.tag}`)
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
            type: 6, //USER 
            required: true
        },
        {
            name: "amount",
            description: "Amount of prestige",
            type: 10, //Number //3, //STRING
            required: false
        }
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