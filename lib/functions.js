const noblox = require('noblox.js')
const rankData = require('../config/ranks.json')
const { group } = require('../config/config')
const GUFID = group

const getDiscordIdFromRobloxId = async (userID) => {
    const API = process.env.ROVERIFY_API
    const guildID = process.env.GUILDID

    const url = `http://registry.rover.link/api/guilds/${guildID}/roblox-to-discord/${userID}`

    let request = await fetch(url, {
        headers: {
            Authorization: `Bearer ${API}`
        }
    })
    const results = await request.json()
    console.log(results)

    return results
}

const getRobloxDataFromDiscordUserId = async (userID) => {

    const API = process.env.ROVERIFY_API
    const guildID = process.env.GUILDID
    const url = `http://registry.rover.link/api/guilds/${guildID}/discord-to-roblox/${userID}`

    let request = await fetch(url, {
        headers: {
            Authorization: `Bearer ${API}`
        }
    })
    response = await request.json()

    if (!response.discordId) {
        response.discordId = userID
    }
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

    console.log(names)
    //console.log(response)
    if (response && response.data) {

        names.forEach(function (name, index) {
            console.log(name)
            let found = false

            response.data.forEach(function (datum, index) {
                //console.log(datum)
                if (datum.requestedUsername && datum.requestedUsername == name) {
                    found = true
                }
            })

            if (found == false) {
                console.log(`${name} NOT FOUND`)
                response.data.push({ requestedUsername: name, found: "Not Found" })
            }
        })

        //console.log(response.data)
        return response.data
    }
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
    //console.log(robloxDataList)
    return robloxDataList
}

const getRankNameInGUF = async (userID) => {
    const rankName = await noblox.getRankNameInGroup(GUFID, Number(userID))
    console.log(rankName)
    return rankName
}

const getRankIdInGUF = async (userID) => {
    const rankId = await noblox.getRankInGroup(GUFID, Number(userID))
    console.log(rankId)
    return rankId
}

const setRank = async (userID, rank) => {
    noblox.setRank(GUFID, userID, rank)
}

module.exports = {
    getRobloxUsersFromMembers,
    getRankNameInGUF,
    getRankIdInGUF,
    getDiscordIdFromRobloxId
}