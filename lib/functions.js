const noblox = require('noblox.js')

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

const getRobloxDataFromRobloxNames = async (names) => {
    //console.log(names)
    const url = `https://users.roblox.com/v1/usernames/users`
    const data = {
        "usernames": names,
        "excludeBannedUsers": true
    }
    const request = await fetch(url, {
        method: "POST",
        headers: { "Content-type": "application/json;charset=UTF-8" },
        body: JSON.stringify(data)
    })
    response = await request.json()
    console.log(response)
    return response.data
}

const getRobloxUsersFromMembers = async (members) => {

    discordIds = members.filter((member) => {
        //console.log(Number(member))
        return String(Number(member)) !== "NaN"
    })

    robloxNames = members.filter((member) => {
        return isNaN(member)
    })

    let robloxDataList = []
    for (const id of discordIds) {
        robloxDataList = robloxDataList.concat(await getRobloxDataFromDiscordUserId(id))
    }
    robloxDataList = robloxDataList.concat(await getRobloxDataFromRobloxNames(robloxNames))
    console.log(robloxDataList)
    return robloxDataList
}

module.exports = {
    getRobloxUsersFromMembers
}