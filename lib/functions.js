
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

const getRobloxUserFromMember = async (member) => {

    const memberTextIsANumber = Number(member)
    let robloxId, robloxName, robloxData;

    //Assuming we are awarding prestige to someone based on Username:
    if (String(memberTextIsANumber) === "NaN") {

        let searchName = member
        robloxData = await getRobloxDataFromRobloxName(searchName)

        if (!robloxData) {
            let msg = `No roblox data exists for ${member}`
            console.log(msg)
            return interaction.reply(msg)
        }
        robloxId = String(robloxData.Id)
        robloxName = robloxData.Username
        if (!robloxId || !robloxName) {
            let msg = `No roblox user id/name exists for ${member}`
            console.log(msg)
            return interaction.reply(msg)
        }

        //Award prestige based on their discord handle:            
    } else {
        const discordUserId = member
        robloxData = await getRobloxDataFromDiscordUserId(discordUserId)
        if (!robloxData) {
            let msg = `No roblox data exists for ${member}`
            console.log(msg)
            return interaction.reply(msg)
        }
        robloxId = String(robloxData.robloxId)
        robloxName = robloxData.cachedUsername
        if (!robloxId || !robloxName) {
            let msg = `No roblox user id/name exists for ${member}`
            console.log(msg)
            return interaction.reply(msg)
        }
    }

    return { robloxId, robloxName }
}

module.exports = {
    getRobloxUserFromMember
}